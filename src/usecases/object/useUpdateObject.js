import { useState, useCallback, useRef } from "react";
import { updateObject } from "../api.js";

export function useUpdateObject() {
  const [object, setObject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const update = useCallback(async (collection, object, options = {}) => {
    setLoading(true);
    setError(null);
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    try {
      const response = await updateObject(collection, object, {
        signal: abortControllerRef.current.signal,
        ...options,
      });
      setObject(response);
      return response;
    } catch (err) {
      if (err.name === "AbortError") {
        console.log("Update object hook was aborted");
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
