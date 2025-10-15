import { useState, useCallback, useRef } from "react";
import { createObject, updateObject } from "../api.js";

export function useUpsertObject() {
  const [object, setObject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const upsert = useCallback(async (collection, object, options = {}) => {
    setLoading(true);
    setError(null);
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    try {
      let response;
      // Check if this is an update (has id) or create (no id)
      if (object && object.id) {
        // Update existing object
        response = await updateObject(collection, object.id, object, {
          signal: abortControllerRef.current.signal,
          upsert: true,
          ...options,
        });
      } else {
        // Create new object
        response = await createObject(collection, object, {
          signal: abortControllerRef.current.signal,
          ...options,
        });
      }
      setObject(response);
      return response;
    } catch (err) {
      if (err.name === "AbortError") {
        console.log("Upsert object hook was aborted");
        return null;
      }
      const errorMessage = `Upsert object failed: ${err.message}`;
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
    upsert,
    object,
    loading,
    error,
    abort
  };
}
