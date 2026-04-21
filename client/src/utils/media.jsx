import { useState } from 'react';

const MEDIA_BASE_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export function getMediaUrl(mediaPath) {
  if (!mediaPath) return null;
  
  // Already a full URL
  if (mediaPath.startsWith('http')) return mediaPath;
  
  // Relative path - add base URL
  if (mediaPath.startsWith('/uploads')) {
    return `${MEDIA_BASE_URL}${mediaPath}`;
  }
  
  // Cloud storage path
  if (mediaPath.startsWith('s3://') || mediaPath.includes('amazonaws.com')) {
    return mediaPath.replace('s3://', 'https://');
  }
  
  // Local file during development
  // If it's just the filename, we assume it's in /uploads/
  if (!mediaPath.includes('/')) {
    return `${MEDIA_BASE_URL}/uploads/${mediaPath}`;
  }
  
  return `${MEDIA_BASE_URL}${mediaPath.startsWith('/') ? '' : '/'}${mediaPath}`;
}

export function SafeImage({ src, alt, className, style, ...props }) {
  const [error, setError] = useState(false);
  const validSrc = getMediaUrl(src);
  
  if (!validSrc || error) {
    return (
      <div 
        className={`${className} image-fallback`} 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          backgroundColor: '#efefef',
          aspectRatio: '1/1',
          color: '#8e8e8e',
          fontSize: '12px',
          ...style
        }}
      >
        <span style={{ fontSize: '24px', marginBottom: '8px' }}>📷</span>
        <span>{alt || 'Image not available'}</span>
      </div>
    );
  }
  
  return (
    <img 
      src={validSrc}
      alt={alt}
      className={className}
      style={style}
      onError={() => setError(true)}
      loading="lazy"
      {...props}
    />
  );
}
