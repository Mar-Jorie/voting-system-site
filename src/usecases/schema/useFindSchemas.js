import { useState, useCallback, useRef } from "react";
import { getSchemas } from "../api.js";

export function useFindSchemas() {
  const [schemas, setSchemas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const find = useCallback(async (where = {}, options = {}) => {
    setLoading(true);
    setError(null);
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    try {
      const response = await getSchemas(where, {
        signal: abortControllerRef.current.signal,
        ...options,
      });
      setSchemas(response || []);
      return response;
    } catch (err) {
      if (err.name === "AbortError") {
        return null;
      }
      const errorMessage = `Find schemas failed: ${err.message}`;
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
    find,
    schemas,
    loading,
    error,
    abort
  };
}
