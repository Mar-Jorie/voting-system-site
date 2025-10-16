import { useState, useCallback, useRef } from "react";
import { deleteObject } from "../api.js";

export function useDeleteObject() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const remove = useCallback(async (collection, objectId, options = {}) => {
    setLoading(true);
    setError(null);
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    try {
      const response = await deleteObject(collection, objectId, {
        signal: abortControllerRef.current.signal,
        ...options,
      });
      return response;
    } catch (err) {
      if (err.name === "AbortError") {
        return null;
      }
      const errorMessage = `Delete object failed: ${err.message}`;
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
    remove,
    loading,
    error,
    abort
  };
}
