import { useState, useCallback, useRef } from "react";
import { countObjects } from "../api.js";

export function useCountObjects() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const countObjectsInCollection = useCallback(async (collection, where = {}, options = {}) => {
    setLoading(true);
    setError(null);
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    try {
      const response = await countObjects(collection, where, {
        signal: abortControllerRef.current.signal,
        ...options,
      });
      setCount(response?.count || 0);
      return response;
    } catch (err) {
      if (err.name === "AbortError") {
        console.log("Count objects hook was aborted");
        return null;
      }
      const errorMessage = `Count objects failed: ${err.message}`;
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
    fetchCount: countObjectsInCollection,
    count,
    loading,
    error,
    abort
  };
}
