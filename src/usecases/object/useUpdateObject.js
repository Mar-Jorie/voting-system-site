import { useState, useCallback, useRef } from "react";
import { updateObject } from "../api.js";

export function useUpdateObject() {
  const [object, setObject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const update = useCallback(async (collection, objectId, data, options = {}) => {
    setLoading(true);
    setError(null);
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    try {
      const response = await updateObject(collection, objectId, data, {
        signal: abortControllerRef.current.signal,
        ...options,
      });
      setObject(response);
      return response;
    } catch (err) {
      if (err.name === "AbortError") {
        return null;
      }
      const errorMessage = `Update object failed: ${err.message}`;
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
    update,
    object,
    loading,
    error,
    abort
  };
}
