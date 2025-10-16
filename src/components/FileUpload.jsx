import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CloudArrowUpIcon, XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import Button from './Button';

const FileUpload = ({
  label = 'Upload Files',
  placeholder = 'Choose files or drag and drop',
  accept = 'image/*',
  multiple = false,
  maxFiles = 10,
  maxSize = 2 * 1024 * 1024, // 2MB default - reduced to avoid server limits
  value = [],
  onChange,
  onError,
  className = '',
  disabled = false,
  required = false,
  showPreview = true,
  previewSize = 'w-20 h-20',
  showLabel = true
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  // Image compression function
  const compressImage = (file, maxWidth = 800, quality = 0.6) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL(file.type, quality);
        
        resolve({
          name: file.name,
          size: Math.round(compressedDataUrl.length * 0.75), // Approximate compressed size
          type: file.type,
          dataUrl: compressedDataUrl,
          file: file
        });
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (files) => {
    if (disabled) return;

    const fileArray = Array.from(files);
    
    // Validate file count
    if (multiple && fileArray.length > maxFiles) {
      onError?.(`Maximum ${maxFiles} files allowed`);
      return;
    }

    if (!multiple && fileArray.length > 1) {
      onError?.('Only one file allowed');
      return;
    }

    // Validate file sizes
    const oversizedFiles = fileArray.filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      const maxSizeMB = Math.round(maxSize / 1024 / 1024);
      const oversizedFileNames = oversizedFiles.map(f => f.name).join(', ');
      onError?.(`File(s) too large: ${oversizedFileNames}. Maximum size is ${maxSizeMB}MB. Images will be automatically compressed.`);
      return;
    }

    setUploading(true);

    try {
      const filePromises = fileArray.map(file => {
        // Compress images, keep other files as is
        if (file.type.startsWith('image/')) {
          return compressImage(file);
        } else {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
              resolve({
                name: file.name,
                size: file.size,
                type: file.type,
                dataUrl: event.target.result,
                file: file
              });
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        }
      });

      const uploadedFiles = await Promise.all(filePromises);
      
      if (multiple) {
        const currentValue = Array.isArray(value) ? value : (value ? [value] : []);
        onChange([...currentValue, ...uploadedFiles]);
      } else {
        onChange(uploadedFiles[0] || null);
      }
    } catch (error) {
      onError?.('Failed to process files');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleInputChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  const removeFile = (index) => {
    if (multiple) {
      const originalFiles = Array.isArray(value) ? value : (value ? [value] : []);
      const newFiles = originalFiles.filter((_, i) => i !== index);
      onChange(newFiles);
    } else {
      onChange(null);
    }
  };

  const openImagePreview = (file) => {
    if (file.type && file.type.startsWith('image/')) {
      setPreviewImage(file);
    }
  };

  const closeImagePreview = () => {
    setPreviewImage(null);
  };

  const openFileDialog = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType) => {
    if (fileType && fileType.startsWith('image/')) {
      return <PhotoIcon className="h-6 w-6 text-blue-500" />;
    }
    return <CloudArrowUpIcon className="h-6 w-6 text-gray-500" />;
  };

  // Handle both file objects and URL strings for existing images
  const normalizeFiles = (files) => {
    if (!files) return [];
    const fileArray = multiple ? files : (files ? [files] : []);
    return fileArray.map(file => {
      // If it's already a file object, return as is
      if (file && typeof file === 'object' && (file.name || file.dataUrl)) {
        return file;
      }
      // If it's a URL string, convert to file object format
      if (typeof file === 'string' && file.trim()) {
        return {
          name: 'Existing Image',
          size: 0,
          type: 'image/jpeg',
          dataUrl: file,
          isExisting: true
        };
      }
      return null;
    }).filter(Boolean);
  };

  const currentFiles = normalizeFiles(value);

  return (
    <div className={`space-y-3 ${className}`}>
      {showLabel && label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-200
          ${isDragOver 
            ? 'border-primary-500 bg-primary-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${disabled 
            ? 'opacity-50 cursor-not-allowed bg-gray-50' 
            : 'cursor-pointer hover:bg-gray-50'
          }
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />

        <div className="space-y-2">
          <CloudArrowUpIcon className={`h-12 w-12 mx-auto ${isDragOver ? 'text-primary-500' : 'text-gray-400'}`} />
          
          <div className="text-sm">
            <span className="font-medium text-primary-600 hover:text-primary-500">
              Click to upload
            </span>
            <span className="text-gray-500"> or drag and drop</span>
          </div>
          
          <p className="text-xs text-gray-500">
            {placeholder}
          </p>
          
          {maxSize && (
            <p className="text-xs text-gray-400">
              Max file size: {Math.round(maxSize / 1024 / 1024)}MB
              {multiple && ` • Max files: ${maxFiles}`}
              {accept.includes('image') && (
                <span className="block mt-1 text-blue-600">
                  Images will be automatically compressed for optimal storage
                </span>
              )}
            </p>
          )}
        </div>

        {uploading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
              <span className="text-sm text-gray-600">Uploading...</span>
            </div>
          </div>
        )}
      </div>

      {/* File Preview - Only show when there are actual files */}
      {showPreview && currentFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            Uploaded Files ({currentFiles.length})
          </h4>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {currentFiles.map((file, index) => (
              <div key={index} className="relative group">
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  {file.type && file.type.startsWith('image/') ? (
                    <img
                      src={file.dataUrl}
                      alt={file.name}
                      className={`${previewSize} object-cover rounded-lg mx-auto cursor-pointer hover:opacity-80 transition-opacity duration-200`}
                      onClick={() => openImagePreview(file)}
                    />
                  ) : (
                    <div className={`${previewSize} flex items-center justify-center bg-gray-100 rounded-lg mx-auto`}>
                      {getFileIcon(file.type || 'unknown')}
                    </div>
                  )}
                  
                  <div className="mt-2 text-center">
                    <p className="text-xs font-medium text-gray-900 truncate" title={file.name}>
                      {file.isExisting ? 'Existing Image' : file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {file.isExisting ? 'Current' : formatFileSize(file.size)}
                    </p>
                  </div>
                </div>

                {!disabled && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-100 transition-colors duration-200 hover:bg-red-600 touch-manipulation min-w-[24px] min-h-[24px]"
                    aria-label="Remove file"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}


      {/* Image Preview Modal */}
      {previewImage && createPortal(
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40 transition-opacity bg-black/50" 
              onClick={closeImagePreview}
            ></div>
            
            {/* Modal Content */}
            <div className="relative z-50 w-full max-w-4xl p-6 overflow-hidden text-left transition-all transform bg-white shadow-xl rounded-xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {previewImage.isExisting ? 'Existing Image' : previewImage.name}
                </h3>
                <button
                  onClick={closeImagePreview}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              {/* Image */}
              <div className="flex justify-center">
                <img
                  src={previewImage.dataUrl}
                  alt={previewImage.name}
                  className="max-w-full max-h-[80vh] object-contain rounded-lg"
                />
              </div>
              
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default FileUpload;
