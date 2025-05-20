import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  ActivityIndicator, 
  Alert,
  Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

// API URL - should be from environment variables in production
const host = Constants.expoConfig?.extra?.host;
const API_URL = `http://${host}:3000`;

interface OrchidResult {
  label: string;
  id: string;
  confidence: number;
  info: {
    description: string;
    habitat: string;
    care: string;
  }
}

export default function IdentificationScreen() {
  // 状态管理
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OrchidResult | null>(null);

  // 处理图片选择
  const handleSelectImage = async () => {
    try {
      // 请求权限
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant permission to access your photo library'
        );
        return;
      }
      
      // 选择图片
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);
        setError(null);
        setResult(null);
      }
    } catch (err) {
      console.error('Image selection error:', err);
      setError('Failed to select image. Please try again.');
    }
  };

  // 处理拍照
  const handleTakePhoto = async () => {
    try {
      // 请求权限
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant permission to access your camera'
        );
        return;
      }
      
      // 拍照
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);
        setError(null);
        setResult(null);
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Failed to take photo. Please try again.');
    }
  };

  // 处理重置
  const handleReset = () => {
    setSelectedImage(null);
    setError(null);
    setResult(null);
  };

  // 处理识别请求
  const handleIdentify = async () => {
    if (!selectedImage) {
      setError('Please select an image first');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      let requestBody;
      let headers = {};
      
      // 检查是否是web平台和base64图像
      if (Platform.OS === 'web' && selectedImage.startsWith('data:image')) {
        try {
          // 使用Blob API处理Web图像
          const response = await fetch(selectedImage);
          const blob = await response.blob();
          
          // 创建FormData并添加Blob
          const formData = new FormData();
          formData.append('image', blob, 'image.jpg');
          
          requestBody = formData;
          // 不设置Content-Type，让浏览器自动处理
        } catch (err) {
          console.error('Failed to process image:', err);
          throw new Error('Failed to process image. Please try again.');
        }
      } else {
        // 原生平台使用FormData
        const fileName = selectedImage.split('/').pop() || 'upload.jpg';
        const formData = new FormData();
        formData.append('image', {
          uri: selectedImage,
          name: fileName,
          type: 'image/jpeg',
        } as any);
        requestBody = formData;
        // 不设置Content-Type，让系统自动处理
      }
      
      // 发送请求
      const response = await fetch(`${API_URL}/api/identify-orchid`, {
        method: 'POST',
        headers,
        body: requestBody,
      });
      
      // 检查响应状态
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Identification request failed');
      }
      
      // 解析响应
      const data = await response.json();
      setResult(data.orchid);
    } catch (err: any) {
      console.error('Identification error:', err);
      setError(err.message || 'An error occurred during identification');
    } finally {
      setLoading(false);
    }
  };

  // 添加这个辅助函数来压缩web图像
  const compressImageForWeb = (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      if (Platform.OS === 'web') {
        // Web平台特定代码
        const img = document.createElement('img');
        img.onload = () => {
          const canvas = document.createElement('canvas');
          // 计算调整后的尺寸，确保宽度不超过800像素
          let width = img.width;
          let height = img.height;
          if (width > 800) {
            height = Math.floor(height * (800 / width));
            width = 800;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // 以较低质量输出JPEG
            resolve(canvas.toDataURL('image/jpeg', 0.6));
          } else {
            // 如果无法获取2D上下文，返回原图
            resolve(dataUrl);
          }
        };
        img.src = dataUrl;
      } else {
        // 非Web平台直接返回原图
        resolve(dataUrl);
      }
    });
  };

  return (
    <ScrollView style={styles.container}>
      {/* 页面标题 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Plant Identification</Text>
        <Text style={styles.headerSubtitle}>
          Upload an orchid image for automatic identification
        </Text>
      </View>
      
      {/* 上传部分 */}
      <View style={styles.uploadCard}>
        <Text style={styles.sectionTitle}>Upload Image</Text>
        <Text style={styles.sectionDescription}>
          Please upload a clear orchid image for the most accurate identification results
        </Text>
        
        {selectedImage ? (
          <View style={styles.previewContainer}>
            <Image
              source={{ uri: selectedImage }}
              style={styles.imagePreview}
              resizeMode="cover"
            />
            <TouchableOpacity style={styles.removeButton} onPress={handleReset}>
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.uploadOptions}>
            <TouchableOpacity style={styles.uploadButton} onPress={handleSelectImage}>
              <Ionicons name="images-outline" size={30} color="#4fe0be" />
              <Text style={styles.uploadButtonText}>Select from Gallery</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.uploadButton} onPress={handleTakePhoto}>
              <Ionicons name="camera-outline" size={30} color="#4fe0be" />
              <Text style={styles.uploadButtonText}>Take a Photo</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color="#d32f2f" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        
        <View style={styles.actionButtons}>
          {selectedImage && (
            <TouchableOpacity
              style={styles.identifyButton}
              onPress={handleIdentify}
              disabled={loading}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.buttonText}>Identifying...</Text>
                </View>
              ) : (
                <>
                  <Ionicons name="search" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Start Identification</Text>
                </>
              )}
            </TouchableOpacity>
          )}
          
          {selectedImage && !loading && (
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Ionicons name="refresh" size={20} color="#4fe0be" />
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {/* 结果部分 */}
      {result && (
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>Identification Result</Text>
            <View style={styles.confidenceBadge}>
              <Text style={styles.confidenceText}>
                Confidence: {(result.confidence * 100).toFixed(2)}%
              </Text>
            </View>
          </View>
          
          <View style={styles.resultName}>
            <Text style={styles.orchidName}>{result.label}</Text>
            <Text style={styles.scientificName}>{result.id}</Text>
          </View>
          
          <View style={styles.resultDetails}>
            <View style={styles.detailSection}>
              <Text style={styles.detailTitle}>Description</Text>
              <Text style={styles.detailText}>{result.info.description}</Text>
            </View>
            
            <View style={styles.detailSection}>
              <Text style={styles.detailTitle}>Habitat</Text>
              <Text style={styles.detailText}>{result.info.habitat}</Text>
            </View>
            
            <View style={styles.detailSection}>
              <Text style={styles.detailTitle}>Care Guide</Text>
              <Text style={styles.detailText}>{result.info.care}</Text>
            </View>
          </View>
          
          <View style={styles.resultActions}>
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={() => Alert.alert('Info', 'Feature under development...')}
            >
              <Ionicons name="save-outline" size={20} color="#fff" />
              <Text style={styles.buttonText}>Save Result</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.shareButton}
              onPress={() => Alert.alert('Info', 'Feature under development...')}
            >
              <Ionicons name="share-social-outline" size={20} color="#fff" />
              <Text style={styles.buttonText}>Share Result</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {/* 摄影提示部分 */}
      <View style={styles.tipsSection}>
        <Text style={styles.tipsTitle}>Photography Tips</Text>
        <View style={styles.tipsContainer}>
          <View style={styles.tipCard}>
            <View style={styles.tipIcon}>
              <Ionicons name="camera-outline" size={24} color="#4fe0be" />
            </View>
            <Text style={styles.tipTitle}>Clear Shots</Text>
            <Text style={styles.tipText}>
              Ensure the image is clear, without blurriness, and avoid overexposure or shadows
            </Text>
          </View>
          
          <View style={styles.tipCard}>
            <View style={styles.tipIcon}>
              <Ionicons name="sunny-outline" size={24} color="#4fe0be" />
            </View>
            <Text style={styles.tipTitle}>Proper Lighting</Text>
            <Text style={styles.tipText}>
              Take photos in natural light, avoid using flash
            </Text>
          </View>
          
          <View style={styles.tipCard}>
            <View style={styles.tipIcon}>
              <Ionicons name="expand-outline" size={24} color="#4fe0be" />
            </View>
            <Text style={styles.tipTitle}>Appropriate Distance</Text>
            <Text style={styles.tipText}>
              Maintain an appropriate distance to ensure the flower is clearly visible in the frame
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    backgroundColor: '#4fe0be',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 5,
  },
  uploadCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    margin: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  uploadOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
  },
  uploadButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderWidth: 2,
    borderColor: '#4fe0be',
    borderStyle: 'dashed',
    borderRadius: 10,
    width: '45%',
  },
  uploadButtonText: {
    color: '#4fe0be',
    marginTop: 10,
    textAlign: 'center',
  },
  previewContainer: {
    position: 'relative',
    alignItems: 'center',
    marginVertical: 20,
  },
  imagePreview: {
    width: '100%',
    height: 250,
    borderRadius: 10,
  },
  removeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    padding: 10,
    borderRadius: 5,
    marginVertical: 10,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    marginLeft: 10,
  },
  actionButtons: {
    marginTop: 20,
  },
  identifyButton: {
    backgroundColor: '#4fe0be',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#4fe0be',
    borderRadius: 5,
  },
  resetButtonText: {
    color: '#4fe0be',
    fontSize: 16,
    marginLeft: 10,
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    margin: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  confidenceBadge: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  confidenceText: {
    color: '#2e7d32',
    fontSize: 12,
    fontWeight: 'bold',
  },
  resultName: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  orchidName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  scientificName: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#666',
    marginTop: 5,
  },
  resultDetails: {
    marginBottom: 20,
  },
  detailSection: {
    marginBottom: 15,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  resultActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saveButton: {
    backgroundColor: '#2e7d32',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 5,
    flex: 1,
    marginRight: 10,
  },
  shareButton: {
    backgroundColor: '#1976d2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 5,
    flex: 1,
  },
  tipsSection: {
    margin: 15,
    marginBottom: 30,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  tipsContainer: {
    
  },
  tipCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tipIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(79, 224, 190, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  }
}); 