/**
 * Video optimization utilities for admin panel
 */

// Video upload limits
export const VIDEO_LIMITS = {
  maxSizeMB: 100,           // Maximum 100MB
  maxDurationSeconds: 300,  // Maximum 5 minutes
  maxResolution: 1080,      // Maximum 1080p
  targetBitrate: 2500000,   // Target bitrate 2.5 Mbps
  allowedFormats: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/x-matroska'],
  allowedExtensions: ['.mp4', '.mov', '.avi', '.webm', '.mkv'],
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
};

/**
 * Format duration for display
 */
export const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Get video metadata (duration, resolution) using HTML5 video element
 */
export const getVideoMetadata = (file) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        aspectRatio: video.videoWidth / video.videoHeight,
      });
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Video meta verisi okunamadı'));
    };
    
    video.src = URL.createObjectURL(file);
  });
};

/**
 * Validate video file
 */
export const validateVideo = async (file) => {
  const errors = [];
  
  // Check file type
  if (!VIDEO_LIMITS.allowedFormats.includes(file.type)) {
    const ext = file.name.toLowerCase().split('.').pop();
    if (!VIDEO_LIMITS.allowedExtensions.includes(`.${ext}`)) {
      errors.push({
        type: 'format',
        message: `Geçersiz video formatı. İzin verilen formatlar: ${VIDEO_LIMITS.allowedExtensions.join(', ')}`,
      });
    }
  }
  
  // Check file size
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > VIDEO_LIMITS.maxSizeMB) {
    errors.push({
      type: 'size',
      message: `Video boyutu çok büyük (${formatFileSize(file.size)}). Maksimum: ${VIDEO_LIMITS.maxSizeMB}MB`,
    });
  }
  
  // Check duration
  try {
    const metadata = await getVideoMetadata(file);
    
    if (metadata.duration > VIDEO_LIMITS.maxDurationSeconds) {
      errors.push({
        type: 'duration',
        message: `Video süresi çok uzun (${formatDuration(metadata.duration)}). Maksimum: ${formatDuration(VIDEO_LIMITS.maxDurationSeconds)}`,
      });
    }
    
    return {
      valid: errors.length === 0,
      errors,
      metadata,
    };
  } catch (err) {
    console.warn('Could not read video metadata:', err);
    return {
      valid: errors.length === 0,
      errors,
      metadata: null,
    };
  }
};

/**
 * Generate video thumbnail using canvas
 */
export const generateVideoThumbnail = (file, seekTime = 1) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    
    video.onloadeddata = () => {
      // Seek to the specified time
      video.currentTime = Math.min(seekTime, video.duration);
    };
    
    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(video.src);
            if (blob) {
              resolve(URL.createObjectURL(blob));
            } else {
              reject(new Error('Thumbnail oluşturulamadı'));
            }
          },
          'image/jpeg',
          0.8
        );
      } catch (err) {
        URL.revokeObjectURL(video.src);
        reject(err);
      }
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Video yüklenemedi'));
    };
    
    video.src = URL.createObjectURL(file);
  });
};

/**
 * Check if browser supports video compression (MediaRecorder with specific codecs)
 */
export const isCompressionSupported = () => {
  if (!window.MediaRecorder) return false;
  
  const mimeTypes = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ];
  
  return mimeTypes.some(type => MediaRecorder.isTypeSupported(type));
};

/**
 * Compress video using MediaRecorder (browser-native)
 * Note: This is a basic compression, for better results use FFmpeg.wasm
 */
export const compressVideo = async (file, options = {}) => {
  const { targetBitrate = VIDEO_LIMITS.targetBitrate, onProgress } = options;
  
  // If compression not supported or file is already small, return original
  if (!isCompressionSupported() || file.size < 20 * 1024 * 1024) {
    console.log('Skipping compression - not supported or file already small');
    return file;
  }
  
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    
    video.onloadeddata = async () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Determine output resolution (max 720p for compression)
        let width = video.videoWidth;
        let height = video.videoHeight;
        const maxDimension = 720;
        
        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Create media stream from canvas
        const stream = canvas.captureStream(30); // 30 FPS
        
        // Add audio track if exists
        if (video.audioTracks && video.audioTracks.length > 0) {
          const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          const source = audioCtx.createMediaElementSource(video);
          const dest = audioCtx.createMediaStreamDestination();
          source.connect(dest);
          source.connect(audioCtx.destination);
          stream.addTrack(dest.stream.getAudioTracks()[0]);
        }
        
        // Setup MediaRecorder
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : 'video/webm;codecs=vp8';
        
        const recorder = new MediaRecorder(stream, {
          mimeType,
          videoBitsPerSecond: targetBitrate,
        });
        
        const chunks = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };
        
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: mimeType });
          const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.webm'), {
            type: mimeType,
          });
          
          URL.revokeObjectURL(video.src);
          
          console.log(`Video compressed: ${formatFileSize(file.size)} -> ${formatFileSize(compressedFile.size)}`);
          resolve(compressedFile);
        };
        
        recorder.onerror = (e) => {
          URL.revokeObjectURL(video.src);
          reject(e.error);
        };
        
        // Start recording and playback
        recorder.start(1000); // Collect data every second
        video.play();
        
        // Draw frames to canvas
        const drawFrame = () => {
          if (video.paused || video.ended) {
            recorder.stop();
            return;
          }
          
          ctx.drawImage(video, 0, 0, width, height);
          
          if (onProgress) {
            onProgress(Math.round((video.currentTime / video.duration) * 100));
          }
          
          requestAnimationFrame(drawFrame);
        };
        
        drawFrame();
        
      } catch (err) {
        URL.revokeObjectURL(video.src);
        reject(err);
      }
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Video yüklenemedi'));
    };
    
    video.src = URL.createObjectURL(file);
  });
};

/**
 * Process video for upload - validate, optionally compress, generate thumbnail
 */
export const processVideoForUpload = async (file, options = {}) => {
  const { shouldCompress = false, onProgress } = options;
  
  // Validate
  const validation = await validateVideo(file);
  
  if (!validation.valid) {
    return {
      success: false,
      errors: validation.errors,
      file: null,
      thumbnail: null,
      metadata: validation.metadata,
    };
  }
  
  let processedFile = file;
  
  // Optionally compress
  if (shouldCompress && file.size > 20 * 1024 * 1024) {
    try {
      onProgress?.({ stage: 'compressing', progress: 0 });
      processedFile = await compressVideo(file, {
        onProgress: (p) => onProgress?.({ stage: 'compressing', progress: p }),
      });
    } catch (err) {
      console.warn('Compression failed, using original file:', err);
    }
  }
  
  // Generate thumbnail
  let thumbnail = null;
  try {
    thumbnail = await generateVideoThumbnail(processedFile);
  } catch (err) {
    console.warn('Thumbnail generation failed:', err);
  }
  
  return {
    success: true,
    errors: [],
    file: processedFile,
    thumbnail,
    metadata: validation.metadata,
    originalSize: file.size,
    processedSize: processedFile.size,
    compressionRatio: file.size > 0 ? (processedFile.size / file.size * 100).toFixed(1) : 100,
  };
};

/**
 * Optimal video player settings for streaming
 */
export const OPTIMAL_VIDEO_SETTINGS = {
  preload: 'metadata',     // Only load metadata initially
  playsInline: true,       // Prevent fullscreen on mobile
  controlsList: 'nodownload', // Hide download button
};

export default {
  VIDEO_LIMITS,
  formatFileSize,
  formatDuration,
  getVideoMetadata,
  validateVideo,
  generateVideoThumbnail,
  isCompressionSupported,
  compressVideo,
  processVideoForUpload,
  OPTIMAL_VIDEO_SETTINGS,
};
