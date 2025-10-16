import { useState, useCallback, useRef } from "react";
import { uploadFile } from "../api.js";

export function useUploadFile() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const upload = useCallback(async (fileToUpload, filename, options = {}) => {
    setLoading(true);
    setError(null);
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    try {
      const response = await uploadFile(fileToUpload, filename, {
        signal: abortControllerRef.current.signal,
        ...options,
      });
      setFile(response);
      return response;
    } catch (err) {
      if (err.name === "AbortError") {
        return null;
      }
      const errorMessage = `Upload file failed: ${err.message}`;
      setError(new Error(errorMessage));
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, []);

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return {
    upload,
    file,
    loading,
    error,
    abort
  };
}
