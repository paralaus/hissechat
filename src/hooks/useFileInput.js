import {useMemo, useRef, useState, useCallback} from 'react';
import {useMutation} from '@tanstack/react-query';
import {uploadFile, uploadFileWithProgress} from '../api/api';
import {validateVideo, processVideoForUpload, VIDEO_LIMITS} from '../utils/video';

const useFileInput = (options = {}) => {
  const { accept, validateOnSelect = true, maxSizeMB = 100 } = options;
  const ref = useRef();
  const [selected, setSelected] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoMetadata, setVideoMetadata] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const {mutateAsync, isPending: isUploading} = useMutation({
    mutationFn: ({file, onProgress}) => uploadFileWithProgress(file, onProgress),
  });

  // Check if file is a video
  const isVideoFile = (file) => {
    return file?.type?.startsWith('video/') || 
           VIDEO_LIMITS.allowedExtensions.some(ext => file?.name?.toLowerCase().endsWith(ext));
  };

  // Validate file on selection
  const validateFile = useCallback(async (file) => {
    setValidationError(null);
    setVideoMetadata(null);
    setThumbnail(null);

    if (!file) return true;

    // Check general file size
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      setValidationError(`Dosya boyutu çok büyük (${sizeMB.toFixed(1)}MB). Maksimum: ${maxSizeMB}MB`);
      return false;
    }

    // If it's a video file, do additional validation
    if (isVideoFile(file)) {
      try {
        setIsProcessing(true);
        const result = await processVideoForUpload(file, { shouldCompress: false });
        
        if (!result.success) {
          setValidationError(result.errors.map(e => e.message).join('\n'));
          setIsProcessing(false);
          return false;
        }

        setVideoMetadata(result.metadata);
        if (result.thumbnail) {
          setThumbnail(result.thumbnail);
        }
        setIsProcessing(false);
      } catch (err) {
        console.warn('Video validation error:', err);
        setIsProcessing(false);
        // Don't block upload on validation failure
      }
    }

    return true;
  }, [maxSizeMB]);

  // Handle file selection
  const handleFileChange = useCallback(async (event) => {
    const files = event.target.files;
    
    if (!files || files.length === 0) {
      setSelected(null);
      return;
    }

    const file = files[0];

    if (validateOnSelect) {
      const isValid = await validateFile(file);
      if (!isValid) {
        // Still allow selection but show error
        setSelected(files);
        return;
      }
    }

    setSelected(files);
    setValidationError(null);
  }, [validateOnSelect, validateFile]);

  const upload = async (options = {}) => {
    if (!selected) return false;
    
    // Don't upload if there's a validation error
    if (validationError && options.blockOnError !== false) {
      console.warn('Upload blocked due to validation error:', validationError);
      return false;
    }
    
    try {
      setUploadProgress(0);
      
      const file = selected[0];
      
      // Handle progress updates
      const onProgress = (progress) => {
        setUploadProgress(progress);
        options.onProgress?.(progress);
      };

      const {data} = await mutateAsync({ file, onProgress });
      
      setUploadProgress(100);
      
      if (data?.url) return data.url;
      return false;
    } catch (e) {
      console.error('Upload error:', e);
      setUploadProgress(0);
      return false;
    }
  };

  const input = useMemo(() => {
    return (
      <input
        ref={ref}
        type="file"
        name="file"
        accept={accept}
        hidden
        onChange={handleFileChange}
      />
    );
  }, [accept, handleFileChange]);

  const open = () => {
    ref.current?.click?.();
  };

  const reset = () => {
    setSelected(null);
    setValidationError(null);
    setVideoMetadata(null);
    setThumbnail(null);
    setUploadProgress(0);
    setIsProcessing(false);
    // Reset the input value to allow selecting the same file again
    if (ref.current) {
      ref.current.value = '';
    }
  };

  return {
    input,
    open,
    file: selected?.[0],
    files: selected,
    upload,
    isUploading,
    isProcessing,
    uploadProgress,
    objectUrl: selected ? URL.createObjectURL(selected[0]) : null,
    reset,
    // Validation
    validationError,
    isValid: !validationError,
    // Video specific
    isVideo: selected ? isVideoFile(selected[0]) : false,
    videoMetadata,
    thumbnail,
    // Helpers
    formatSize: (bytes) => {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    },
  };
};

export default useFileInput;
