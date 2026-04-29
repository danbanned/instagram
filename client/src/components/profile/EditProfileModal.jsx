'use client';

import { useEffect, useState, useRef } from 'react';
import api from '../../services/api';
import { SafeImage } from '../../utils/media';
import styles from './EditProfileModal.module.css';

export default function EditProfileModal({ profile, isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: profile.name || '',
    bio: profile.bio || '',
    website: profile.website || '',
    email: profile.email || '',
    phoneNumber: profile.phoneNumber || '',
    actionButtons: profile.actionButtons || ['results', 'podcast', 'free trainings', 'about'],
    gender: profile.gender || '',
    isPrivate: profile.isPrivate || false
  });

  const formatPhoneNumber = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };
  
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(profile.avatar || '/default-avatar.png');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setFormData({
      name: profile.name || '',
      bio: profile.bio || '',
      website: profile.website || '',
      email: profile.email || '',
      phoneNumber: profile.phoneNumber || '',
      actionButtons: profile.actionButtons || ['results', 'podcast', 'free trainings', 'about'],
      gender: profile.gender || '',
      isPrivate: profile.isPrivate || false
    });
    setAvatarPreview(profile.avatar || '/default-avatar.png');
    setAvatarFile(null);
  }, [profile]);

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  // Handle profile picture selection
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file (JPEG, PNG, GIF, etc.)');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      
      setAvatarFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload avatar to server
  const uploadAvatar = async () => {
    if (!avatarFile) return null;
    
    const formData = new FormData();
    formData.append('avatar', avatarFile);
    
    try {
      const response = await api.post('/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data.avatarUrl;
    } catch (error) {
      console.error('Avatar upload error:', error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    try {
      setUploading(true);
      let avatarUrl = profile.avatar;
      
      // Upload avatar if changed
      if (avatarFile) {
        avatarUrl = await uploadAvatar();
      }
      
      // Update profile with new avatar URL
      const updatedData = { ...formData, avatar: avatarUrl };
      await api.put('/profile/update', updatedData);
      onSave(updatedData);
      onClose();
    } catch (error) {
      console.error('Update profile error:', error);
      alert('Error updating profile');
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Edit Profile</h2>
          <button onClick={onClose} className={styles.closeBtn}>×</button>
        </div>

        <div className={styles.modalBody}>
          {/* Avatar Section - Updated with upload button */}
          <div className={styles.avatarSection}>
            <div className={styles.avatarWrapper}>
              <SafeImage src={avatarPreview} alt="Profile" className={styles.avatarImage} />
              <button 
                className={styles.changePhotoBtn}
                onClick={handleAvatarClick}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Change profile photo'}
              </button>
            </div>
            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/jpeg,image/png,image/gif,image/webp"
              style={{ display: 'none' }}
            />
          </div>

          {/* Form Fields */}
          <div className={styles.formGroup}>
            <label>Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Name"
              disabled={uploading}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => handleChange('bio', e.target.value)}
              placeholder="Bio"
              rows={3}
              maxLength={150}
              disabled={uploading}
            />
            <div className={styles.charCount}>{formData.bio.length}/150</div>
          </div>

          <div className={styles.formGroup}>
            <label>Website</label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => handleChange('website', e.target.value)}
              placeholder="Website"
              disabled={uploading}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Phone Number</label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => handleChange('phoneNumber', formatPhoneNumber(e.target.value))}
              placeholder="(555) 123-4567"
              maxLength={14}
              disabled={uploading}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Public Email (displayed in bio)</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="Email for bio"
              disabled={uploading}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Action Buttons</label>
            <div className={styles.actionButtonsEditor}>
              {formData.actionButtons.map((btn, idx) => (
                <div key={idx} className={styles.actionButtonInputRow}>
                  <input
                    type="text"
                    value={btn}
                    onChange={(e) => {
                      const newBtns = [...formData.actionButtons];
                      newBtns[idx] = e.target.value;
                      handleChange('actionButtons', newBtns);
                    }}
                  />
                  <button 
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => {
                      const newBtns = formData.actionButtons.filter((_, i) => i !== idx);
                      handleChange('actionButtons', newBtns);
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button 
                type="button"
                className={styles.addBtn}
                onClick={() => handleChange('actionButtons', [...formData.actionButtons, ''])}
              >
                + Add Action Button
              </button>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Gender</label>
            <select 
              value={formData.gender} 
              onChange={(e) => handleChange('gender', e.target.value)}
              disabled={uploading}
            >
              <option value="">Prefer not to say</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="non-binary">Non-binary</option>
            </select>
          </div>

          <div className={styles.checkboxGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.isPrivate}
                onChange={(e) => handleChange('isPrivate', e.target.checked)}
                disabled={uploading}
              />
              <span>Private account</span>
            </label>
            <p className={styles.hint}>
              When your account is private, only people you approve can see your photos and videos.
            </p>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button 
            className={styles.cancelButton} 
            onClick={onClose}
            disabled={uploading}
          >
            Cancel
          </button>
          <button 
            className={styles.saveButton} 
            onClick={handleSubmit}
            disabled={uploading}
          >
            {uploading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}