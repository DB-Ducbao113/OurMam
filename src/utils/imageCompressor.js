/**
 * ==============================================================================
 * CLIENT-SIDE IMAGE COMPRESSOR UTILITY
 * Resizes & compresses images to WebP/JPEG (< 150KB) to ensure lifetime free storage
 * ==============================================================================
 */

import { ENV } from '../config/env.js';

export async function compressImageFile(file, maxWidth = ENV.IMAGE_MAX_WIDTH, quality = ENV.IMAGE_QUALITY) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error("No file provided"));
    
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to optimized JPEG data string
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export function captureVideoFrame(videoElement, maxWidth = ENV.IMAGE_MAX_WIDTH, quality = ENV.IMAGE_QUALITY) {
  const canvas = document.createElement('canvas');
  let width = videoElement.videoWidth || 800;
  let height = videoElement.videoHeight || 600;

  if (width > maxWidth) {
    height = Math.round((height * maxWidth) / width);
    width = maxWidth;
  }

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(videoElement, 0, 0, width, height);

  return canvas.toDataURL('image/jpeg', quality);
}

export function dataUrlToBlob(dataUrl) {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}
