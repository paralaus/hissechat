/**
 * Video Optimizer Utility (Web Version)
 * Handles video validation and thumbnail generation
 */

// Video limits configuration
export const VIDEO_LIMITS = {
  maxSizeMB: 500, // Increased for web (mobile was 100)
  maxDurationSeconds: 600, // 10 minutes
  thumbnailTimeMs: 1000, // 1 second
};

/**
 * Validate video before upload
 */
export const validateVideo = async file => {
  const errors = [];
  const warnings = [];

  const sizeMB = file.size / (1024 * 1024);

  // Check file size
  if (sizeMB > VIDEO_LIMITS.maxSizeMB) {
    errors.push(
      `Video boyutu çok büyük (${sizeMB.toFixed(
        1,
      )}MB). Maksimum ${VIDEO_LIMITS.maxSizeMB}MB olmalı.`,
    );
  } else if (sizeMB > VIDEO_LIMITS.maxSizeMB * 0.7) {
    warnings.push(
      `Video boyutu büyük (${sizeMB.toFixed(1)}MB). Yükleme zaman alabilir.`,
    );
  }

  // Get duration (needs loading video metadata)
  let duration = 0;
  try {
    duration = await getVideoDuration(file);
    if (duration > VIDEO_LIMITS.maxDurationSeconds) {
      errors.push(
        `Video süresi çok uzun (${Math.floor(duration / 60)}dk ${Math.floor(
          duration % 60,
        )}sn).`,
      );
    }
  } catch (e) {
    console.warn('Could not determine video duration', e);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    info: {
      sizeMB,
      duration,
      needsCompression: false, // Web side compression skipped for now
    },
  };
};

/**
 * Generate thumbnail for video using Canvas
 */
export const generateVideoThumbnail = async (
  file,
  timeMs = VIDEO_LIMITS.thumbnailTimeMs,
) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = URL.createObjectURL(file);
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = () => {
      video.currentTime = timeMs / 1000;
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        URL.revokeObjectURL(video.src);
        resolve(dataUrl);
      } catch (e) {
        URL.revokeObjectURL(video.src);
        reject(e);
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Video loading failed'));
    };
  });
};

/**
 * Helper to get video duration
 */
const getVideoDuration = file => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = () => {
      reject('Invalid video');
    };
    video.src = window.URL.createObjectURL(file);
  });
};

/**
 * Process video for upload
 * Validates and generates thumbnail
 */
export const processVideoForUpload = async (
  file,
  options = {},
) => {
  const {onProgress} = options;

  // Step 1: Validate
  onProgress?.('validation', 0);
  const validation = await validateVideo(file);

  if (!validation.isValid) {
    return {
      success: false,
      processedFile: file,
      thumbnail: null,
      validation,
      error: validation.errors[0],
    };
  }

  onProgress?.('validation', 100);

  // Step 2: Generate thumbnail
  let thumbnail = null;
  try {
    onProgress?.('thumbnail', 0);
    thumbnail = await generateVideoThumbnail(file);
    onProgress?.('thumbnail', 100);
  } catch (e) {
    console.warn('Thumbnail generation failed', e);
  }

  // Step 3: Compression (Skipped on web, returning original file)
  // Note: True client-side compression on web requires heavy WASM libraries (ffmpeg.wasm).
  // For admin panel usage, we rely on chunked upload for reliability.

  return {
    success: true,
    processedFile: file, // Return original file
    thumbnail,
    validation,
  };
};

export const formatFileSize = bytes => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};
