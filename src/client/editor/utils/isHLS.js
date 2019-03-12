const HLS_MIMETYPES = ["application/x-mpegurl", "application/vnd.apple.mpegurl"];

// Extracted from AFrame: https://github.com/aframevr/aframe/blob/master/src/utils/material.js#L165
export default function isHLS(src, type) {
  if (type && HLS_MIMETYPES.includes(type.toLowerCase())) {
    return true;
  }
  if (src && src.toLowerCase().indexOf(".m3u8") > 0) {
    return true;
  }
  return false;
}
