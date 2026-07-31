import {useMemo, useRef, useState, useCallback, useEffect} from 'react';
import {useMutation} from '@tanstack/react-query';
import {uploadFileWithProgress} from '../api/api';
import {processVideoForUpload} from '../utils/videoOptimizer';

const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];

const useFileInput = (options = {}) => {
  const {
    accept,
    validateOnSelect = true,
    maxSizeMB = 100,
    multiple = false,
  } = options;
  const ref = useRef();
  const [selected, setSelected] = useState(null);
  const [objectUrl, setObjectUrl] = useState(null);
  const [objectUrls, setObjectUrls] = useState([]);
  const [validationError, setValidationError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoMetadata, setVideoMetadata] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedFiles = useMemo(() => {
    if (!selected) return [];
    if (selected instanceof Blob) return [selected];
    if (Array.isArray(selected)) return selected.filter(Boolean);
    return Array.from(selected).filter(Boolean);
  }, [selected]);

  const selectedFile = useMemo(() => {
    return selectedFiles[0] || null;
  }, [selectedFiles]);

  const {mutateAsync, isPending: isUploading} = useMutation({
    mutationFn: ({file, onProgress, isPrivate}) =>
      uploadFileWithProgress(file, onProgress, {isPrivate}),
  });

  // Check if file is a video
  const isVideoFile = file => {
    return (
      file?.type?.startsWith('video/') ||
      VIDEO_EXTENSIONS.some(ext => file?.name?.toLowerCase().endsWith(ext))
    );
  };

  // Validate file on selection
  const validateFile = useCallback(
    async file => {
      setValidationError(null);
      setVideoMetadata(null);
      setThumbnail(null);

      if (!file) return {valid: true};

      // Check general file size
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > maxSizeMB) {
        const error = `Dosya boyutu çok büyük (${sizeMB.toFixed(
          1,
        )}MB). Maksimum: ${maxSizeMB}MB`;
        setValidationError(error);
        return {valid: false, error};
      }

      // If it's a video file, do additional validation
      if (isVideoFile(file)) {
        try {
          setIsProcessing(true);
          const result = await processVideoForUpload(file, {
            shouldCompress: false,
          });

          if (!result.success) {
            const errorMessages = Array.isArray(result?.validation?.errors)
              ? result.validation.errors
              : result?.error
              ? [result.error]
              : ['Video dogrulanamadi.'];
            const error = errorMessages.join('\n');
            setValidationError(error);
            setIsProcessing(false);
            return {valid: false, error};
          }

          setVideoMetadata(result?.validation?.info || null);
          if (result.thumbnail) {
            setThumbnail(result.thumbnail);
          }
          setIsProcessing(false);
          return {
            valid: true,
            metadata: result?.validation?.info || null,
            thumbnail: result.thumbnail,
            processedFile: result.processedFile, // In case we want to use the processed file
          };
        } catch (err) {
          console.warn('Video validation error:', err);
          setIsProcessing(false);
          // Don't block upload on validation failure
        }
      }

      return {valid: true};
    },
    [maxSizeMB],
  );

  // Handle file selection
  const handleFileChange = useCallback(
    async event => {
      const files = Array.from(event.target.files || []);

      if (!files || files.length === 0) {
        setSelected(null);
        return;
      }

      const file = files[0];

      if (validateOnSelect) {
        const result = await validateFile(file);
        if (!result.valid) {
          // Still allow selection but show error
          setSelected(multiple ? files : files.slice(0, 1));
          return;
        }
      }

      setSelected(prevSelected => {
        if (!multiple) {
          return files.slice(0, 1);
        }

        const previousFiles = Array.isArray(prevSelected)
          ? prevSelected
          : prevSelected
          ? Array.from(prevSelected)
          : [];

        return [...previousFiles, ...files];
      });
      setValidationError(null);
    },
    [multiple, validateOnSelect, validateFile],
  );

  // Programmatically select a file without going through the hidden <input> (e.g. clipboard paste)
  const selectFile = useCallback(
    async file => {
      if (!file) return;

      if (validateOnSelect) {
        const result = await validateFile(file);
        if (!result.valid) {
          setSelected(multiple ? [file] : [file]);
          return;
        }
      }

      setSelected(prevSelected => {
        if (!multiple) return [file];

        const previousFiles = Array.isArray(prevSelected)
          ? prevSelected
          : prevSelected
          ? Array.from(prevSelected)
          : [];

        return [...previousFiles, file];
      });
      setValidationError(null);
    },
    [multiple, validateOnSelect, validateFile],
  );

  const upload = async (options = {}) => {
    const file = options.file || selected?.[0];

    if (!file) return false;

    // Don't upload if there's a validation error (only if using selected file)
    if (!options.file && validationError && options.blockOnError !== false) {
      console.warn('Upload blocked due to validation error:', validationError);
      return false;
    }

    try {
      setUploadProgress(0);

      // Handle progress updates
      const onProgress = progress => {
        setUploadProgress(progress);
        options.onProgress?.(progress);
      };

      const {data} = await mutateAsync({
        file,
        onProgress,
        isPrivate: Boolean(options.isPrivate),
      });

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
        multiple={multiple}
        hidden
        onChange={handleFileChange}
      />
    );
  }, [accept, handleFileChange, multiple]);

  const open = () => {
    ref.current?.click?.();
  };

  useEffect(() => {
    if (!selectedFiles.length) {
      setObjectUrls([]);
      setObjectUrl(null);
      return undefined;
    }

    const nextObjectUrls = selectedFiles.map(file => URL.createObjectURL(file));
    setObjectUrls(nextObjectUrls);
    setObjectUrl(nextObjectUrls[0] || null);

    return () => {
      nextObjectUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [selectedFiles]);

  const reset = () => {
    setSelected(null);
    setObjectUrl(null);
    setObjectUrls([]);
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

  const removeFile = index => {
    if (!selectedFiles.length) return;
    const nextFiles = selectedFiles.filter(
      (_, fileIndex) => fileIndex !== index,
    );
    setSelected(nextFiles.length ? nextFiles : null);
    if (ref.current) {
      ref.current.value = '';
    }
    if (!nextFiles.length) {
      setValidationError(null);
      setVideoMetadata(null);
      setThumbnail(null);
      setUploadProgress(0);
      setIsProcessing(false);
    }
  };

  return {
    input,
    open,
    file: selectedFile,
    files: selected,
    upload,
    selectFile,
    isUploading,
    isProcessing,
    uploadProgress,
    objectUrl,
    objectUrls,
    reset,
    removeFile,
    // Validation
    validationError,
    isValid: !validationError,
    // Video specific
    isVideo: selectedFile ? isVideoFile(selectedFile) : false,
    videoMetadata,
    thumbnail,
    selectedFiles,
    // Helpers
    formatSize: bytes => {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    },
  };
};

export default useFileInput;
