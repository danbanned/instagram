import { useState, useRef } from 'react';
import api from '../../services/api';
import styles from './MessageInput.module.css';

export default function MessageInput({ onSendMessage, onTyping, replyTo, onCancelReply }) {
  const [text, setText] = useState('');
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSend = () => {
    if (!text.trim() && !isUploading) return;
    onSendMessage({ content: text, replyToId: replyTo?.id });
    setText('');
    if (onCancelReply) onCancelReply();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const handleChange = (e) => {
    setText(e.target.value);
    onTyping(e.target.value.length > 0);
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('media', file);

    try {
      const response = await api.post('/messages/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const { mediaUrl, mediaType } = response.data;
      onSendMessage({ mediaUrl, mediaType, replyToId: replyTo?.id });
      if (onCancelReply) onCancelReply();
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload file');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className={styles.container}>
      {replyTo && (
        <div className={styles.replyPreview}>
          <div className={styles.replyInfo}>
            <span className={styles.replyLabel}>Replying to {replyTo.sender?.username}</span>
            <p className={styles.replyText}>{replyTo.content || 'Media'}</p>
          </div>
          <button className={styles.cancelReply} onClick={onCancelReply}>✕</button>
        </div>
      )}
      
      <div className={styles.inputArea}>
        <button className={styles.iconButton} onClick={handleFileClick} title="Upload media">
          🖼️
        </button>
        
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleFileChange}
          accept="image/*,video/*,audio/*"
        />

        <input 
          className={styles.input}
          value={text}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          placeholder="Message..."
          disabled={isUploading}
        />

        {text.trim() ? (
          <button className={styles.sendButton} onClick={handleSend}>
            Send
          </button>
        ) : (
          <button className={styles.iconButton} title="Record voice (Hold)">
            🎙️
          </button>
        )}
      </div>
      
      {isUploading && <div className={styles.uploadProgress}>Uploading...</div>}
    </div>
  );
}
