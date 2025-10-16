/**
 * File Compression Utility
 * Handles compression of various file types with configurable settings
 */

// Configuration constants
export const COMPRESSION_CONFIG = {
  MIN_COMPRESSION_SIZE: 100 * 1024, // 100KB - files larger than this will be compressed
  IMAGE: {
    MAX_WIDTH: 400,
    MAX_HEIGHT: 300,
    QUALITY: 0.4,
    FORMAT: 'image/jpeg' // Convert to JPEG for better compression
  },
  PDF: {
    MAX_PAGES: 50,
    QUALITY: 0.7
  },
  VIDEO: {
    MAX_WIDTH: 1280,
    MAX_HEIGHT: 720,
    BITRATE: 1000000, // 1Mbps
    FORMAT: 'video/mp4'
  }
};

/**
 * Check if file should be compressed based on size
 */
export const shouldCompressFile = (file) => {
  return file.size > COMPRESSION_CONFIG.MIN_COMPRESSION_SIZE;
};

/**
 * Get compression info for a file
 */
export const getCompressionInfo = (file) => {
  const originalSize = file.size;
  const shouldCompress = shouldCompressFile(file);
  const fileType = file.type;
  
  let estimatedCompressedSize = originalSize;
  let compressionRatio = 1;
  
  if (shouldCompress) {
    if (fileType.startsWith('image/')) {
      compressionRatio = 0.3; // Images can be compressed to ~30% of original size
    } else if (fileType === 'application/pdf') {
      compressionRatio = 0.7; // PDFs can be compressed to ~70% of original size
    } else if (fileType.startsWith('video/')) {
      compressionRatio = 0.5; // Videos can be compressed to ~50% of original size
    } else {
      compressionRatio = 0.8; // Other files can be compressed to ~80% of original size
    }
    
    estimatedCompressedSize = Math.round(originalSize * compressionRatio);
  }
  
  return {
    originalSize,
    estimatedCompressedSize,
    shouldCompress,
    compressionRatio,
    savings: originalSize - estimatedCompressedSize,
    savingsPercentage: Math.round(((originalSize - estimatedCompressedSize) / originalSize) * 100)
  };
};

/**
 * Compress image file using canvas
 */
export const compressImage = (file, options = {}) => {
  return new Promise((resolve, reject) => {
    const {
      maxWidth = COMPRESSION_CONFIG.IMAGE.MAX_WIDTH,
      maxHeight = COMPRESSION_CONFIG.IMAGE.MAX_HEIGHT,
      quality = COMPRESSION_CONFIG.IMAGE.QUALITY,
      format = COMPRESSION_CONFIG.IMAGE.FORMAT
    } = options;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      try {
        // Calculate new dimensions maintaining aspect ratio
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;
          
          if (width > height) {
            width = Math.min(width, maxWidth);
            height = width / aspectRatio;
          } else {
            height = Math.min(height, maxHeight);
            width = height * aspectRatio;
          }
        }
        
        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob with compression
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: format,
              lastModified: Date.now()
            });
            
            resolve({
              file: compressedFile,
              originalSize: file.size,
              compressedSize: blob.size,
              compressionRatio: blob.size / file.size,
              savings: file.size - blob.size,
              savingsPercentage: Math.round(((file.size - blob.size) / file.size) * 100)
            });
          } else {
            reject(new Error('Failed to compress image'));
          }
        }, format, quality);
        
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Compress PDF file (basic implementation - for full PDF compression, use a server-side solution)
 */
export const compressPDF = (file, options = {}) => {
  return new Promise((resolve, reject) => {
    // Note: Full PDF compression requires server-side processing
    // This is a placeholder that returns the original file
    // In a real implementation, you would send the file to a server for compression
    
    console.warn('PDF compression requires server-side processing. Returning original file.');
    
    resolve({
      file: file,
      originalSize: file.size,
      compressedSize: file.size,
      compressionRatio: 1,
      savings: 0,
      savingsPercentage: 0,
      note: 'PDF compression requires server-side processing'
    });
  });
};

/**
 * Compress video file (basic implementation - for full video compression, use a server-side solution)
 */
export const compressVideo = (file, options = {}) => {
  return new Promise((resolve, reject) => {
    // Note: Full video compression requires server-side processing or WebCodecs API
    // This is a placeholder that returns the original file
    // In a real implementation, you would use WebCodecs API or send to server
    
    console.warn('Video compression requires server-side processing or WebCodecs API. Returning original file.');
    
    resolve({
      file: file,
      originalSize: file.size,
      compressedSize: file.size,
      compressionRatio: 1,
      savings: 0,
      savingsPercentage: 0,
      note: 'Video compression requires server-side processing'
    });
  });
};

/**
 * Compress any file type
 */
export const compressFile = async (file, options = {}) => {
  const fileType = file.type;
  
  try {
    if (fileType.startsWith('image/')) {
      return await compressImage(file, options);
    } else if (fileType === 'application/pdf') {
      return await compressPDF(file, options);
    } else if (fileType.startsWith('video/')) {
      return await compressVideo(file, options);
    } else {
      // For other file types, return as-is (no compression available)
      return {
        file: file,
        originalSize: file.size,
        compressedSize: file.size,
        compressionRatio: 1,
        savings: 0,
        savingsPercentage: 0,
        note: 'No compression available for this file type'
      };
    }
  } catch (error) {
    throw new Error(`Failed to compress file: ${error.message}`);
  }
};

/**
 * Process multiple files with compression
 */
export const processFilesWithCompression = async (files, options = {}) => {
  const results = [];
  
  for (const file of files) {
    try {
      const compressionInfo = getCompressionInfo(file);
      
      if (compressionInfo.shouldCompress) {
        const compressionResult = await compressFile(file, options);
        results.push({
          ...compressionResult,
          originalFile: file,
          wasCompressed: true
        });
      } else {
        results.push({
          file: file,
          originalSize: file.size,
          compressedSize: file.size,
          compressionRatio: 1,
          savings: 0,
          savingsPercentage: 0,
          originalFile: file,
          wasCompressed: false
        });
      }
    } catch (error) {
      // If compression fails, use original file
      results.push({
        file: file,
        originalSize: file.size,
        compressedSize: file.size,
        compressionRatio: 1,
        savings: 0,
        savingsPercentage: 0,
        originalFile: file,
        wasCompressed: false,
        error: error.message
      });
    }
  }
  
  return results;
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Get compression summary for multiple files
 */
export const getCompressionSummary = (results) => {
  const totalOriginalSize = results.reduce((sum, result) => sum + result.originalSize, 0);
  const totalCompressedSize = results.reduce((sum, result) => sum + result.compressedSize, 0);
  const totalSavings = totalOriginalSize - totalCompressedSize;
  const totalSavingsPercentage = totalOriginalSize > 0 ? Math.round((totalSavings / totalOriginalSize) * 100) : 0;
  const compressedCount = results.filter(result => result.wasCompressed).length;
  
  return {
    totalFiles: results.length,
    compressedFiles: compressedCount,
    totalOriginalSize,
    totalCompressedSize,
    totalSavings,
    totalSavingsPercentage,
    averageCompressionRatio: results.length > 0 ? results.reduce((sum, result) => sum + result.compressionRatio, 0) / results.length : 1
  };
};
