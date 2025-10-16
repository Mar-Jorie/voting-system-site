import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { 
  shouldCompressFile, 
  getCompressionInfo, 
  processFilesWithCompression, 
  formatFileSize,
  getCompressionSummary 
} from '../../utils/fileCompression';

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

  const processFile = useCallback(async (file) => {
    try {
      const compressionInfo = getCompressionInfo(file);
      
      if (compressionInfo.shouldCompress) {
        // Process with compression
        const compressionResults = await processFilesWithCompression([file]);
        const result = compressionResults[0];
        
        // Convert compressed file to data URL
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target.result);
          reader.onerror = reject;
          reader.readAsDataURL(result.file);
        });
        
        return {
          id: Date.now() + Math.random(),
          name: file.name,
          size: result.compressedSize,
          originalSize: result.originalSize,
          type: result.file.type,
          dataUrl: dataUrl,
          file: result.file,
          uploadedAt: new Date().toISOString(),
          wasCompressed: true,
          compressionInfo: {
            savings: result.savings,
            savingsPercentage: result.savingsPercentage,
            compressionRatio: result.compressionRatio
          }
        };
      } else {
        // Process without compression
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            resolve({
              id: Date.now() + Math.random(),
              name: file.name,
              size: file.size,
              originalSize: file.size,
              type: file.type,
              dataUrl: event.target.result,
              file: file,
              uploadedAt: new Date().toISOString(),
              wasCompressed: false,
              compressionInfo: {
                savings: 0,
                savingsPercentage: 0,
                compressionRatio: 1
              }
            });
          };
          reader.onerror = () => reject(new Error(`Failed to read file "${file.name}"`));
          reader.readAsDataURL(file);
        });
      }
    } catch (error) {
      throw new Error(`Failed to process file "${file.name}": ${error.message}`);
    }
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

      // Show compression summary if any files were compressed
      const compressedFiles = processedFiles.filter(file => file.wasCompressed);
      if (compressedFiles.length > 0) {
        const totalSavings = compressedFiles.reduce((sum, file) => sum + file.compressionInfo.savings, 0);
        const totalOriginalSize = compressedFiles.reduce((sum, file) => sum + file.originalSize, 0);
        const savingsPercentage = Math.round((totalSavings / totalOriginalSize) * 100);
        
        toast.success(
          `${processedFiles.length} file(s) uploaded successfully. ${compressedFiles.length} files compressed, ${formatFileSize(totalSavings)} saved (${savingsPercentage}% reduction)`,
          { duration: 5000 }
        );
      } else {
        toast.success(`${processedFiles.length} file(s) uploaded successfully`);
      }

      if (multiple) {
        setFiles(prev => [...prev, ...processedFiles]);
      } else {
        setFiles(processedFiles);
      }

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

  // formatFileSize is now imported from utils/fileCompression

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
