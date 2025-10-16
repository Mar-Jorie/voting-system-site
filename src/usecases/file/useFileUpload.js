import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

const useFileUpload = ({
  maxFiles = 10,
  maxSize = 5 * 1024 * 1024, // 5MB
  accept = 'image/*',
  multiple = false
} = {}) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const validateFile = useCallback((file) => {
    // Check file size
    if (file.size > maxSize) {
      throw new Error(`File "${file.name}" is too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB`);
    }

    // Check file type
    if (accept && accept !== '*/*') {
      const acceptedTypes = accept.split(',').map(type => type.trim());
      const fileType = file.type;
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
      
      const isAccepted = acceptedTypes.some(acceptedType => {
        if (acceptedType.startsWith('.')) {
          return fileExtension === acceptedType;
        } else if (acceptedType.endsWith('/*')) {
          const baseType = acceptedType.slice(0, -2);
          return fileType.startsWith(baseType);
        } else {
          return fileType === acceptedType;
        }
      });

      if (!isAccepted) {
        throw new Error(`File "${file.name}" is not an accepted file type`);
      }
    }

    return true;
  }, [maxSize, accept]);

  const processFile = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        resolve({
          id: Date.now() + Math.random(),
          name: file.name,
          size: file.size,
          type: file.type,
          dataUrl: event.target.result,
          file: file,
          uploadedAt: new Date().toISOString()
        });
      };
      reader.onerror = () => reject(new Error(`Failed to read file "${file.name}"`));
      reader.readAsDataURL(file);
    });
  }, []);

  const uploadFiles = useCallback(async (fileList) => {
    if (!fileList || fileList.length === 0) return;

    const fileArray = Array.from(fileList);
    
    // Validate file count
    if (multiple && fileArray.length > maxFiles) {
      throw new Error(`Maximum ${maxFiles} files allowed`);
    }

    if (!multiple && fileArray.length > 1) {
      throw new Error('Only one file allowed');
    }

    setUploading(true);
    setError(null);

    try {
      // Validate all files first
      fileArray.forEach(validateFile);

      // Process all files
      const processedFiles = await Promise.all(fileArray.map(processFile));

      if (multiple) {
        setFiles(prev => [...prev, ...processedFiles]);
      } else {
        setFiles(processedFiles);
      }

      toast.success(`${processedFiles.length} file(s) uploaded successfully`);
      return processedFiles;
    } catch (err) {
      const errorMessage = err.message || 'Failed to upload files';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setUploading(false);
    }
  }, [multiple, maxFiles, validateFile, processFile]);

  const removeFile = useCallback((fileId) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
    toast.success('File removed');
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
    setError(null);
  }, []);

  const getFileById = useCallback((fileId) => {
    return files.find(file => file.id === fileId);
  }, [files]);

  const getFilesByType = useCallback((type) => {
    return files.filter(file => file.type.startsWith(type));
  }, [files]);

  const getTotalSize = useCallback(() => {
    return files.reduce((total, file) => total + file.size, 0);
  }, [files]);

  const formatFileSize = useCallback((bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  return {
    files,
    uploading,
    error,
    uploadFiles,
    removeFile,
    clearFiles,
    getFileById,
    getFilesByType,
    getTotalSize,
    formatFileSize,
    setFiles,
    setError
  };
};

export default useFileUpload;
