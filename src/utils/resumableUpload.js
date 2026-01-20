/**
 * Resumable Upload Utility (Web Version)
 * Uploads large files in chunks and supports resuming after interruption
 */

import apiClient from '../api/client';

// 256KB chunks for better reliability
const CHUNK_SIZE = 256 * 1024;
// Threshold for using resumable upload (5MB)
const RESUMABLE_THRESHOLD = 5 * 1024 * 1024;
const UPLOAD_STATE_PREFIX = 'resumable_upload_';

class ResumableUploader {
  constructor() {
    this.isPaused = false;
    this.isCancelled = false;
    this.currentUploadId = null;
    this.serverUploadId = null;
    this.lastProgressTime = 0;
    this.lastProgressBytes = 0;
    this.lastOptions = null;
    this.retryOptions = {
      attempts: 8,
      baseDelayMs: 1000,
      maxDelayMs: 20000,
      jitter: true,
    };
    this.abortController = null;
  }

  /**
   * Start new upload or resume existing one
   */
  async upload(options) {
    const {
      file, // Browser File object
      onError,
      forceResumable,
    } = options;

    console.log('[Upload] Starting upload', {
      fileName: file.name,
      size: file.size,
    });

    this.isPaused = false;
    this.isCancelled = false;
    this.lastOptions = options;
    this.abortController = new AbortController();
    this.lastProgressTime = 0;
    this.lastProgressBytes = 0;

    try {
      const fileSize = file.size;

      // Use standard upload for small files
      if (fileSize < RESUMABLE_THRESHOLD && !forceResumable) {
        return await this.standardUpload(options);
      }

      // Use chunked upload for large files
      return await this.chunkedUpload(options);
    } catch (error) {
      if (error.name === 'CanceledError' || this.isCancelled) {
        console.log('[Upload] Upload cancelled');
        return null;
      }

      console.error('[Upload] Upload error', error);
      onError?.(error);
      return null;
    }
  }

  /**
   * Standard upload for small files
   */
  async standardUpload(options) {
    const {file, onProgress, onComplete} = options;

    console.log('[Upload] Starting standard upload');

    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/upload/file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      signal: this.abortController?.signal,
      onUploadProgress: progressEvent => {
        if (this.isCancelled || this.isPaused) return;

        const total = progressEvent.total || file.size;
        const loaded = progressEvent.loaded;

        const progress = this.calculateProgress(
          loaded,
          total,
          1,
          loaded >= total ? 1 : 0,
        );
        onProgress?.(progress);
      },
    });

    console.log('[Upload] Standard upload complete', response.data);

    if (onComplete) {
      onComplete(response.data.url);
    }

    return response.data.url;
  }

  /**
   * Chunked upload for large files
   */
  async chunkedUpload(options) {
    const {file, onProgress, onComplete} = options;

    const fileSize = file.size;
    const fileName = file.name;
    const mimeType = file.type;
    const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);

    // Generate or reuse upload ID
    const localUploadId =
      this.currentUploadId ||
      `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.currentUploadId = localUploadId;

    console.log('[Upload] Starting chunked upload', {
      uploadId: localUploadId,
      totalChunks,
    });

    // Check existing state
    let state = this.getUploadState(localUploadId);

    if (!state) {
      // Initialize new session on server
      try {
        const initResponse = await this.initServerUpload({
          fileName,
          fileSize,
          mimeType,
          totalChunks,
        });

        this.serverUploadId = initResponse.uploadId;

        state = {
          uploadId: localUploadId,
          fileName,
          fileSize,
          mimeType,
          totalChunks,
          uploadedChunks: [],
          serverUploadId: initResponse.uploadId,
          createdAt: Date.now(),
          lastUpdatedAt: Date.now(),
        };

        this.saveUploadState(state);
      } catch (initError) {
        console.error(
          '[Upload] Init failed, falling back to standard upload',
          initError,
        );
        return await this.standardUpload(options);
      }
    } else {
      this.serverUploadId = state.serverUploadId;
      console.log('[Upload] Resuming session', {
        serverUploadId: this.serverUploadId,
        uploadedChunks: state.uploadedChunks.length,
      });
    }

    // Upload chunks
    for (let i = 0; i < totalChunks; i++) {
      if (this.isCancelled) return null;

      if (this.isPaused) {
        options.onPause?.();
        return null;
      }

      // Skip if already uploaded
      if (state.uploadedChunks.includes(i)) {
        continue;
      }

      // Read chunk
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, fileSize);
      const chunkBlob = file.slice(start, end);
      const chunkData = await this.readChunkAsBase64(chunkBlob);

      // Upload chunk
      try {
        await this.uploadChunk({
          serverUploadId: this.serverUploadId,
          chunkIndex: i,
          totalChunks,
          chunkData,
          fileName,
          mimeType,
        });

        // Update state
        state.uploadedChunks.push(i);
        state.lastUpdatedAt = Date.now();
        this.saveUploadState(state);

        // Report progress
        const uploadedBytes =
          (state.uploadedChunks.length / totalChunks) * fileSize;
        const progress = this.calculateProgress(
          uploadedBytes,
          fileSize,
          totalChunks,
          state.uploadedChunks.length,
        );
        onProgress?.(progress);
      } catch (chunkError) {
        console.error(`[Upload] Chunk ${i} failed`, chunkError);
        throw chunkError;
      }
    }

    // Complete upload
    console.log('[Upload] Finalizing upload...');
    const result = await this.completeUpload(this.serverUploadId);

    // Cleanup
    this.clearUploadState(localUploadId);
    this.serverUploadId = null;
    this.currentUploadId = null;

    if (onComplete) {
      onComplete(result.url);
    }

    return result.url;
  }

  // Helper: Read Blob as Base64 string
  readChunkAsBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        // Remove data URL prefix (e.g. "data:application/octet-stream;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
      reader.readAsDataURL(blob);
    });
  }

  // Helper: Calculate progress
  calculateProgress(loaded, total, totalChunks, chunksUploaded) {
    const now = Date.now();
    let speed = 0;
    let remainingTime = 0;

    if (this.lastProgressTime > 0 && loaded > this.lastProgressBytes) {
      const timeDiff = (now - this.lastProgressTime) / 1000;
      const bytesDiff = loaded - this.lastProgressBytes;
      if (timeDiff > 0) {
        speed = bytesDiff / timeDiff;
        if (speed > 0) {
          remainingTime = (total - loaded) / speed;
        }
      }
    }

    this.lastProgressTime = now;
    this.lastProgressBytes = loaded;

    return {
      loaded,
      total,
      percentage: Math.min(100, Math.round((loaded / total) * 100)),
      chunksUploaded,
      totalChunks,
      speed,
      remainingTime,
    };
  }

  // Helper: API calls with retry
  async initServerUpload(data) {
    return this.withRetry(async () => {
      const response = await apiClient.post('/upload/init-resumable', data, {
        timeout: 15000,
      });
      return response.data;
    });
  }

  async uploadChunk(data) {
    return this.withRetry(async () => {
      await apiClient.post('/upload/chunk', data, {timeout: 30000});
    });
  }

  async completeUpload(serverUploadId) {
    return this.withRetry(async () => {
      const response = await apiClient.post(
        '/upload/complete-resumable',
        {uploadId: serverUploadId},
        {timeout: 60000},
      );
      return response.data;
    });
  }

  async withRetry(fn) {
    let tries = 0;
    const {attempts, baseDelayMs, maxDelayMs} = this.retryOptions;
    let delay = baseDelayMs;

    while (tries <= attempts) {
      try {
        return await fn();
      } catch (err) {
        tries++;
        if (tries > attempts || this.isCancelled) throw err;

        console.log(`[Upload] Retry ${tries}/${attempts} in ${delay}ms`);
        // eslint-disable-next-line no-loop-func
        await new Promise(r => setTimeout(r, delay));
        delay = Math.min(maxDelayMs, delay * 2);
      }
    }
  }

  // State management (LocalStorage)
  getUploadState(uploadId) {
    try {
      const item = localStorage.getItem(`${UPLOAD_STATE_PREFIX}${uploadId}`);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  saveUploadState(state) {
    try {
      localStorage.setItem(
        `${UPLOAD_STATE_PREFIX}${state.uploadId}`,
        JSON.stringify(state),
      );
    } catch (e) {
      console.error('[Upload] Failed to save state', e);
    }
  }

  clearUploadState(uploadId) {
    try {
      localStorage.removeItem(`${UPLOAD_STATE_PREFIX}${uploadId}`);
    } catch (e) {
      console.error('[Upload] Failed to clear state', e);
    }
  }

  pause() {
    this.isPaused = true;
    this.abortController?.abort();
  }

  resume() {
    if (this.lastOptions) {
      this.upload(this.lastOptions);
    }
  }

  cancel() {
    this.isCancelled = true;
    this.abortController?.abort();
    if (this.currentUploadId) {
      this.clearUploadState(this.currentUploadId);
    }
  }
}

export const resumableUploader = new ResumableUploader();
export default resumableUploader;
