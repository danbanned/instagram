'use client';

import { useState } from 'react';
import styles from './EditProfileModal.module.css';

export default function EditProfileModal({ profile, isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: profile.name || '',
    bio: profile.bio || '',
    website: profile.website || '',
    email: profile.email || '',
    phoneNumber: profile.phoneNumber || '',
    gender: profile.gender || '',
    isPrivate: profile.isPrivate || false
  });

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          // Auth header would go here if not handled by interceptors/cookies
        },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        onSave(formData);
        onClose();
      } else {
        alert('Failed to update profile');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      alert('Error updating profile');
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Edit Profile</h2>
          <button onClick={onClose}>×</button>
        </div>

        <div className={styles.modalBody}>
          {/* Avatar Section */}
          <div className={styles.avatarSection}>
            <img src={profile.avatar || '/default-avatar.png'} alt="Profile" />
            <button className={styles.changePhotoBtn}>Change profile photo</button>
          </div>

          {/* Form Fields */}
          <div className={styles.formGroup}>
            <label>Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Name"
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
            />
          </div>

          <div className={styles.formGroup}>
            <label>Phone Number</label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => handleChange('phoneNumber', e.target.value)}
              placeholder="Phone number"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Gender</label>
            <select value={formData.gender} onChange={(e) => handleChange('gender', e.target.value)}>
              <option value="">Prefer not to say</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="non-binary">Non-binary</option>
            </select>
          </div>

          <div className={styles.checkboxGroup}>
            <label>
              <input
                type="checkbox"
                checked={formData.isPrivate}
                onChange={(e) => handleChange('isPrivate', e.target.checked)}
              />
              Private account
            </label>
            <p className={styles.hint}>When your account is private, only people you approve can see your photos and videos.</p>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.cancelButton} onClick={onClose}>Cancel</button>
          <button className={styles.saveButton} onClick={handleSubmit}>Save</button>
        </div>
      </div>
    </div>
  );
}
