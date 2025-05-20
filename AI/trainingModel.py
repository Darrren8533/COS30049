# Orchid Species Identification - Training Model
# This script trains a deep learning model to identify 52 different orchid species using transfer learning with pre-trained CNNs.

# Import necessary libraries
import os
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from PIL import Image
from tqdm import tqdm

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from torchvision import models, transforms
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score

# Set random seeds for reproducibility
np.random.seed(42)
torch.manual_seed(42)
if torch.cuda.is_available():
    torch.cuda.manual_seed(42)
    torch.backends.cudnn.deterministic = True

# =============== 1. Load and Explore the Dataset ===============
# Load metadata
metadata_path = 'orchids52_metadata-en.txt'
class_names = []

with open(metadata_path, 'r') as f:
    for line in f:
        if line.strip() != '':
            parts = line.strip().split('\t')
            if len(parts) >= 2:
                class_id = parts[0]
                class_name = parts[1]
                class_names.append((class_id, class_name))

# Create a dictionary mapping class IDs to class names
class_dict = {class_id: class_name for class_id, class_name in class_names}
print(f"Total number of classes: {len(class_dict)}")
print("First 5 classes:")
for i, (class_id, class_name) in enumerate(class_names[:5]):
    print(f"{class_id}: {class_name}")

# Get data directories
train_dir = 'train-en'
test_dir = 'test-en'

# Count images in each class
train_counts = {}
test_counts = {}

for class_id in os.listdir(train_dir):
    if os.path.isdir(os.path.join(train_dir, class_id)):
        train_counts[class_id] = len(os.listdir(os.path.join(train_dir, class_id)))

for class_id in os.listdir(test_dir):
    if os.path.isdir(os.path.join(test_dir, class_id)):
        test_counts[class_id] = len(os.listdir(os.path.join(test_dir, class_id)))

# Display some statistics
print(f"Total training images: {sum(train_counts.values())}")
print(f"Total testing images: {sum(test_counts.values())}")
print(f"Average images per class (train): {sum(train_counts.values()) / len(train_counts):.1f}")
print(f"Average images per class (test): {sum(test_counts.values()) / len(test_counts):.1f}")

# Visualize class distribution
plt.figure(figsize=(15, 5))
plt.bar(range(len(train_counts)), list(train_counts.values()))
plt.title('Number of Training Images per Class')
plt.xlabel('Class Index')
plt.ylabel('Number of Images')
plt.xticks(range(len(train_counts)), list(train_counts.keys()), rotation=90)
plt.tight_layout()
plt.savefig('class_distribution.png')
plt.close()

# =============== 2. Visualize Some Sample Images ===============
# Display sample images from each class
num_classes_to_show = 5
images_per_class = 3

plt.figure(figsize=(15, num_classes_to_show * 3))
for i, class_id in enumerate(list(class_dict.keys())[:num_classes_to_show]):
    class_dir = os.path.join(train_dir, class_id)
    img_files = os.listdir(class_dir)[:images_per_class]
    
    for j, img_file in enumerate(img_files):
        img_path = os.path.join(class_dir, img_file)
        img = Image.open(img_path)
        
        plt.subplot(num_classes_to_show, images_per_class, i * images_per_class + j + 1)
        plt.imshow(img)
        plt.title(f"{class_id}: {class_dict[class_id][:20]}...")
        plt.axis('off')
        
plt.tight_layout()
plt.savefig('sample_images.png')
plt.close()

# =============== 3. Create Custom Dataset and DataLoader ===============
# Define transforms for training and testing
train_transforms = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.RandomHorizontalFlip(),
    transforms.RandomRotation(15),
    transforms.ColorJitter(brightness=0.1, contrast=0.1, saturation=0.1, hue=0.1),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

test_transforms = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

# Create custom dataset class
class OrchidDataset(Dataset):
    def __init__(self, root_dir, transform=None):
        self.root_dir = root_dir
        self.transform = transform
        self.classes = [d for d in os.listdir(root_dir) if os.path.isdir(os.path.join(root_dir, d))]
        self.classes.sort()  # Ensure consistent ordering
        self.class_to_idx = {cls: i for i, cls in enumerate(self.classes)}
        
        self.samples = []
        for class_name in self.classes:
            class_dir = os.path.join(root_dir, class_name)
            for img_name in os.listdir(class_dir):
                if img_name.lower().endswith(('.jpg', '.jpeg', '.png')):
                    self.samples.append((os.path.join(class_dir, img_name), self.class_to_idx[class_name]))
    
    def __len__(self):
        return len(self.samples)
    
    def __getitem__(self, idx):
        img_path, label = self.samples[idx]
        image = Image.open(img_path).convert('RGB')
        
        if self.transform:
            image = self.transform(image)
            
        return image, label

# Create datasets and dataloaders
train_dataset = OrchidDataset(train_dir, transform=train_transforms)
test_dataset = OrchidDataset(test_dir, transform=test_transforms)

batch_size = 32
train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=4)
test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False, num_workers=4)

# Print dataset information
print(f"Training dataset size: {len(train_dataset)}")
print(f"Testing dataset size: {len(test_dataset)}")
print(f"Number of classes: {len(train_dataset.classes)}")
print(f"Number of batches (train): {len(train_loader)}")
print(f"Number of batches (test): {len(test_loader)}")

# =============== 4. Define the Model (Transfer Learning with ResNet50) ===============
# Set device
device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
print(f"Using device: {device}")

# Load pre-trained ResNet50 model
def get_model(num_classes):
    model = models.resnet50(pretrained=True)
    
    # Freeze all parameters
    for param in model.parameters():
        param.requires_grad = False
    
    # Replace the final fully connected layer
    num_features = model.fc.in_features
    model.fc = nn.Sequential(
        nn.Linear(num_features, 512),
        nn.ReLU(),
        nn.Dropout(0.3),
        nn.Linear(512, num_classes)
    )
    
    return model

# Create model
num_classes = len(train_dataset.classes)
model = get_model(num_classes)
model = model.to(device)

# Define loss function and optimizer
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.fc.parameters(), lr=0.001)
scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=3, verbose=True)

# =============== 5. Training Function ===============
def train_model(model, train_loader, test_loader, criterion, optimizer, scheduler, num_epochs=25):
    history = {
        'train_loss': [],
        'train_acc': [],
        'val_loss': [],
        'val_acc': []
    }
    
    best_val_acc = 0.0
    
    for epoch in range(num_epochs):
        # Training phase
        model.train()
        running_loss = 0.0
        running_corrects = 0
        
        for inputs, labels in tqdm(train_loader, desc=f"Epoch {epoch+1}/{num_epochs} [Train]"):
            inputs, labels = inputs.to(device), labels.to(device)
            
            # Zero the parameter gradients
            optimizer.zero_grad()
            
            # Forward pass
            outputs = model(inputs)
            _, preds = torch.max(outputs, 1)
            loss = criterion(outputs, labels)
            
            # Backward pass and optimize
            loss.backward()
            optimizer.step()
            
            # Statistics
            running_loss += loss.item() * inputs.size(0)
            running_corrects += torch.sum(preds == labels.data)
        
        epoch_loss = running_loss / len(train_dataset)
        epoch_acc = running_corrects.double() / len(train_dataset)
        
        history['train_loss'].append(epoch_loss)
        history['train_acc'].append(epoch_acc.item())
        
        print(f"[Train] Loss: {epoch_loss:.4f} Acc: {epoch_acc:.4f}")
        
        # Validation phase
        model.eval()
        running_loss = 0.0
        running_corrects = 0
        all_preds = []
        all_labels = []
        
        with torch.no_grad():
            for inputs, labels in tqdm(test_loader, desc=f"Epoch {epoch+1}/{num_epochs} [Val]"):
                inputs, labels = inputs.to(device), labels.to(device)
                
                # Forward pass
                outputs = model(inputs)
                _, preds = torch.max(outputs, 1)
                loss = criterion(outputs, labels)
                
                # Statistics
                running_loss += loss.item() * inputs.size(0)
                running_corrects += torch.sum(preds == labels.data)
                
                all_preds.extend(preds.cpu().numpy())
                all_labels.extend(labels.cpu().numpy())
        
        epoch_loss = running_loss / len(test_dataset)
        epoch_acc = running_corrects.double() / len(test_dataset)
        
        history['val_loss'].append(epoch_loss)
        history['val_acc'].append(epoch_acc.item())
        
        print(f"[Val] Loss: {epoch_loss:.4f} Acc: {epoch_acc:.4f}")
        
        # Update learning rate
        scheduler.step(epoch_loss)
        
        # Save best model
        if epoch_acc > best_val_acc:
            best_val_acc = epoch_acc
            torch.save(model.state_dict(), 'best_model.pth')
            print(f"Saved new best model with accuracy: {best_val_acc:.4f}")
        
        # Print classification report every 5 epochs
        if (epoch + 1) % 5 == 0 or epoch == num_epochs - 1:
            print("\nClassification Report:")
            print(classification_report(all_labels, all_preds, target_names=[class_dict[cls] for cls in train_dataset.classes]))
    
    # Load best model
    model.load_state_dict(torch.load('best_model.pth'))
    
    return model, history

# =============== 6. Train the Model ===============
# Train the model
num_epochs = 20
model, history = train_model(model, train_loader, test_loader, criterion, optimizer, scheduler, num_epochs=num_epochs)

# =============== 7. Visualize Training Results ===============
# Plot training and validation loss
plt.figure(figsize=(12, 4))

plt.subplot(1, 2, 1)
plt.plot(range(num_epochs), history['train_loss'], label='Train Loss')
plt.plot(range(num_epochs), history['val_loss'], label='Validation Loss')
plt.xlabel('Epoch')
plt.ylabel('Loss')
plt.title('Training and Validation Loss')
plt.legend()

plt.subplot(1, 2, 2)
plt.plot(range(num_epochs), history['train_acc'], label='Train Accuracy')
plt.plot(range(num_epochs), history['val_acc'], label='Validation Accuracy')
plt.xlabel('Epoch')
plt.ylabel('Accuracy')
plt.title('Training and Validation Accuracy')
plt.legend()

plt.tight_layout()
plt.savefig('training_history.png')
plt.close()

# =============== 8. Evaluate on Test Set and Generate Confusion Matrix ===============
# Evaluate the model on the test set
model.eval()
all_preds = []
all_labels = []

with torch.no_grad():
    for inputs, labels in tqdm(test_loader, desc="Evaluating"):
        inputs, labels = inputs.to(device), labels.to(device)
        outputs = model(inputs)
        _, preds = torch.max(outputs, 1)
        
        all_preds.extend(preds.cpu().numpy())
        all_labels.extend(labels.cpu().numpy())

# Calculate accuracy
accuracy = accuracy_score(all_labels, all_preds)
print(f"Test Accuracy: {accuracy:.4f}")

# Generate classification report
report = classification_report(all_labels, all_preds, target_names=[class_dict[cls] for cls in train_dataset.classes])
print("\nClassification Report:")
print(report)

# Create confusion matrix
cm = confusion_matrix(all_labels, all_preds)

# Plot confusion matrix (normalized)
plt.figure(figsize=(15, 15))
cm_norm = cm.astype('float') / cm.sum(axis=1)[:, np.newaxis]
sns.heatmap(cm_norm, annot=False, fmt='.2f', cmap='Blues')
plt.xlabel('Predicted Label')
plt.ylabel('True Label')
plt.title('Normalized Confusion Matrix')
plt.tight_layout()
plt.savefig('confusion_matrix.png')
plt.close()

# =============== 9. Save the Model ===============
# Save the model and class mappings
torch.save({
    'model_state_dict': model.state_dict(),
    'class_to_idx': train_dataset.class_to_idx,
    'idx_to_class': {idx: cls for cls, idx in train_dataset.class_to_idx.items()},
    'class_names': class_dict
}, 'orchid_species_model.pth')

print("Model saved successfully!")

# =============== 10. Test Model on New Images ===============
def predict_image(image_path, model, class_names):
    # Load and preprocess the image
    image = Image.open(image_path).convert('RGB')
    transform = test_transforms
    image_tensor = transform(image).unsqueeze(0).to(device)
    
    # Make prediction
    model.eval()
    with torch.no_grad():
        outputs = model(image_tensor)
        probabilities = torch.nn.functional.softmax(outputs, dim=1)[0]
        
        # Get top 5 predictions
        top5_prob, top5_catid = torch.topk(probabilities, 5)
    
    # Display results
    plt.figure(figsize=(10, 5))
    
    plt.subplot(1, 2, 1)
    plt.imshow(image)
    plt.title('Test Image')
    plt.axis('off')
    
    plt.subplot(1, 2, 2)
    y_pos = np.arange(5)
    plt.barh(y_pos, top5_prob.cpu().numpy())
    plt.yticks(y_pos, [class_names[train_dataset.classes[idx]] for idx in top5_catid.cpu().numpy()])
    plt.xlabel('Probability')
    plt.title('Top 5 Predictions')
    
    plt.tight_layout()
    plt.savefig('prediction_example.png')
    plt.close()
    
    print("Top 5 predictions:")
    for i in range(5):
        print(f"{i+1}. {class_names[train_dataset.classes[top5_catid[i].item()]]} ({top5_prob[i].item():.4f})")

# Test on some images from the test set
test_class = train_dataset.classes[0]  # First class
test_image_path = os.path.join(test_dir, test_class, os.listdir(os.path.join(test_dir, test_class))[0])
predict_image(test_image_path, model, class_dict)

print("Training and evaluation complete!")

# =============== (Optional) Try Different Models ===============
# Uncomment to try a different model
"""
# Function to create a model with different architecture
def get_efficientnet_model(num_classes):
    model = models.efficientnet_b0(pretrained=True)
    
    # Freeze all parameters
    for param in model.parameters():
        param.requires_grad = False
    
    # Replace the classifier
    num_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.2, inplace=True),
        nn.Linear(num_features, num_classes)
    )
    
    return model

# Create and train EfficientNet model
model_efficientnet = get_efficientnet_model(num_classes)
model_efficientnet = model_efficientnet.to(device)
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model_efficientnet.classifier.parameters(), lr=0.001)
scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=3, verbose=True)
model_efficientnet, history_efficientnet = train_model(model_efficientnet, train_loader, test_loader, criterion, optimizer, scheduler, num_epochs=10)
"""
