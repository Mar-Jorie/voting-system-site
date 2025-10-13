import { useState, useCallback, useRef } from "react";
import { findObjects } from "../api.js";

export function useFindObjects() {
  const [objects, setObjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const find = useCallback(async (collection, query = {}, options = {}) => {
    setLoading(true);
    setError(null);
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    try {
      const response = await findObjects(collection, query, {
        signal: abortControllerRef.current.signal,
        ...options,
      });
      setObjects(response || []);
      return response;
    } catch (err) {
      if (err.name === "AbortError") {
        console.log("Find objects hook was aborted");
        return null;
      }
      const errorMessage = `Find objects failed: ${err.message}`;
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
    objects,
    loading,
    error,
    abort
  };
}
