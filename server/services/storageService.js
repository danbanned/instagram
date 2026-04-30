function toPublicMediaPath(file) {
  if (!file) return null;
  // If file.path is a full URL (Cloudinary), return it directly.
  // Otherwise, return the local /uploads/ path.
  return file.path && (file.path.startsWith('http') || file.path.startsWith('https'))
    ? file.path
    : `/uploads/${file.filename}`;
}

function getMediaType(mimetype = '') {
  return mimetype.startsWith('video/') ? 'video' : 'image';
}

module.exports = { toPublicMediaPath, getMediaType };
