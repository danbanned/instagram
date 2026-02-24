function toPublicMediaPath(file) {
  if (!file) return null;
  return `/uploads/${file.filename}`;
}

function getMediaType(mimetype = '') {
  return mimetype.startsWith('video/') ? 'video' : 'image';
}

module.exports = { toPublicMediaPath, getMediaType };
