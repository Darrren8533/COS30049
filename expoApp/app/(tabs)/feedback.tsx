import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import Constants from 'expo-constants';

interface Guide {
  id: string;
  name: string;
}

interface FormData {
  name: string;
  email: string;
  guideName: string;
  rating: number;
  guideExperience: string;
  semenggohExperience: string;
}

interface Errors {
  name?: string;
  email?: string;
  guideName?: string;
  rating?: string;
  guideExperience?: string;
  semenggohExperience?: string;
}

const FeedbackScreen = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    guideName: '',
    rating: 0,
    guideExperience: '',
    semenggohExperience: '',
  });
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loadingGuides, setLoadingGuides] = useState(false);
  const host = Constants.expoConfig?.extra?.host;;


  useEffect(() => {
    const fetchGuides = async () => {
      setLoadingGuides(true);
      try {
        const response = await fetch(`http://${host}:3000/api/guides`);
        if (response.ok) {
          const data = await response.json();
          setGuides(data);
        }
      } catch (error) {
        // ignore
      } finally {
        setLoadingGuides(false);
      }
    };
    fetchGuides();
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (submitted) {
      timer = setTimeout(() => setSubmitted(false), 2500);
    }
    return () => { if (timer) clearTimeout(timer); };
  }, [submitted]);

  const validate = () => {
    const newErrors: Errors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.guideName.trim()) newErrors.guideName = 'Park guide name is required';
    if (formData.rating === 0) newErrors.rating = 'Please rate your park guide';
    if (!formData.guideExperience.trim()) newErrors.guideExperience = 'Guide experience is required';
    if (!formData.semenggohExperience.trim()) newErrors.semenggohExperience = 'Semenggoh experience is required';
    return newErrors;
  };

  const handleChange = (name: keyof FormData, value: string) => {
    setFormData((prev: FormData) => ({ ...prev, [name]: value }));
    setErrors((prev: Errors) => ({ ...prev, [name]: '' }));
    setApiError('');
  };

  const handleRating = (value: number) => {
    setFormData((prev: FormData) => ({ ...prev, rating: value }));
    setErrors((prev: Errors) => ({ ...prev, rating: '' }));
    setApiError('');
  };

  const handleSubmit = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setLoading(true);
    setApiError('');
    try {
      const response = await fetch(`http://${host}:3000/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          guide_name: formData.guideName,
          rating: formData.rating,
          guide_experience: formData.guideExperience,
          semenggoh_experience: formData.semenggohExperience
        })
      });
      const data = await response.json();
      if (response.ok) {
        setSubmitted(true);
        setFormData({
          name: '',
          email: '',
          guideName: '',
          rating: 0,
          guideExperience: '',
          semenggohExperience: '',
        });
      } else {
        setApiError(data.message || 'Failed to submit feedback');
      }
    } catch (error) {
      setApiError('An error occurred while submitting your feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Share Your Experience</Text>
      <Text style={styles.subtitle}>Your feedback helps us improve our services and ensure a better experience for all visitors.</Text>
      {submitted && (
        <View style={styles.successMessage}>
          <FontAwesome name="check-circle" size={24} color="#4BB543" />
          <Text style={styles.successText}>Thank you for your feedback! Your input is valuable to us.</Text>
        </View>
      )}
      {apiError ? (
        <View style={styles.errorMessage}>
          <FontAwesome name="exclamation-circle" size={20} color="#d32f2f" />
          <Text style={styles.errorText}>{apiError}</Text>
        </View>
      ) : null}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Your Name *</Text>
        <TextInput
          style={[styles.input, errors.name && styles.inputError]}
          value={formData.name}
          onChangeText={v => handleChange('name', v)}
          editable={!loading}
          placeholder="Enter your name"
        />
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Your Email *</Text>
        <TextInput
          style={[styles.input, errors.email && styles.inputError]}
          value={formData.email}
          onChangeText={v => handleChange('email', v)}
          editable={!loading}
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Park Guide's Name *</Text>
        <View style={[styles.pickerWrapper, errors.guideName && styles.inputError]}>
          <Picker
            selectedValue={formData.guideName}
            onValueChange={(v: string) => handleChange('guideName', v)}
            enabled={!loading && !loadingGuides}
          >
            <Picker.Item label="-- Select a Guide --" value="" />
            {loadingGuides ? (
              <Picker.Item label="Loading guides..." value="" />
            ) : (
              guides.map(guide => (
                <Picker.Item key={guide.id} label={guide.name} value={guide.name} />
              ))
            )}
          </Picker>
        </View>
        {errors.guideName && <Text style={styles.errorText}>{errors.guideName}</Text>}
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Park Guide Rating *</Text>
        <View style={styles.ratingContainer}>
          {[1,2,3,4,5].map(star => (
            <TouchableOpacity
              key={star}
              onPress={() => !loading && handleRating(star)}
              disabled={loading}
            >
              <FontAwesome
                name="star"
                size={32}
                color={formData.rating >= star ? '#FFD700' : '#ccc'}
                style={styles.star}
              />
            </TouchableOpacity>
          ))}
        </View>
        {errors.rating && <Text style={styles.errorText}>{errors.rating}</Text>}
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Experience with the Park Guide *</Text>
        <TextInput
          style={[styles.textarea, errors.guideExperience && styles.inputError]}
          value={formData.guideExperience}
          onChangeText={v => handleChange('guideExperience', v)}
          editable={!loading}
          placeholder="Describe your experience with the park guide"
          multiline
          numberOfLines={4}
        />
        {errors.guideExperience && <Text style={styles.errorText}>{errors.guideExperience}</Text>}
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Your Experience at Semenggoh *</Text>
        <TextInput
          style={[styles.textarea, errors.semenggohExperience && styles.inputError]}
          value={formData.semenggohExperience}
          onChangeText={v => handleChange('semenggohExperience', v)}
          editable={!loading}
          placeholder="Share your experience at Semenggoh"
          multiline
          numberOfLines={4}
        />
        {errors.semenggohExperience && <Text style={styles.errorText}>{errors.semenggohExperience}</Text>}
      </View>
      <Text style={styles.dataPolicy}>
        By submitting this form, you agree that your feedback may be used to improve our services. Your personal information will be handled according to our privacy policy.
      </Text>
      <TouchableOpacity
        style={[styles.submitButton, loading && styles.buttonLoading]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="send" size={20} color="#fff" />
            <Text style={styles.submitButtonText}> Submit Feedback</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2e3a59',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 18,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
    color: '#2e3a59',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    fontSize: 15,
    backgroundColor: '#f9f9f9',
  },
  inputError: {
    borderColor: '#d32f2f',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    backgroundColor: '#f9f9f9',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  star: {
    marginHorizontal: 2,
  },
  textarea: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    fontSize: 15,
    backgroundColor: '#f9f9f9',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#2e7d32',
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  buttonLoading: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  successMessage: {
    backgroundColor: '#e8f5e9',
    borderRadius: 6,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    justifyContent: 'center',
  },
  successText: {
    color: '#388e3c',
    marginLeft: 8,
    fontSize: 15,
  },
  errorMessage: {
    backgroundColor: '#ffebee',
    borderRadius: 6,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    justifyContent: 'center',
  },
  errorText: {
    color: '#d32f2f',
    marginLeft: 8,
    fontSize: 15,
  },
  dataPolicy: {
    fontSize: 13,
    color: '#888',
    marginBottom: 16,
    textAlign: 'center',
  },
});

export default FeedbackScreen;
