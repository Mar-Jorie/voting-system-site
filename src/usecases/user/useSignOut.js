import { useState, useCallback, useRef } from "react";
import { signOut } from "../api.js";

export function useSignOut() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const signOutUser = useCallback(async (options = {}) => {
    setLoading(true);
    setError(null);
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    try {
      const response = await signOut({
        signal: abortControllerRef.current.signal,
        ...options,
      });
      return response;
    } catch (err) {
      if (err.name === "AbortError") {
        console.log("Sign out hook was aborted");
        return null;
      }
      const errorMessage = `Sign out failed: ${err.message}`;
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
    signOut: signOutUser,
    loading,
    error,
    abort
  };
}
