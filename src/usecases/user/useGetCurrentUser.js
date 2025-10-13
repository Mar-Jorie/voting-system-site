import { useState, useCallback, useRef } from "react";
import { getCurrentUser } from "../api.js";

export function useGetCurrentUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const getCurrentUserData = useCallback(async (options = {}) => {
    setLoading(true);
    setError(null);
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    try {
      const response = await getCurrentUser({
        signal: abortControllerRef.current.signal,
        ...options,
      });
      setUser(response);
      return response;
    } catch (err) {
      if (err.name === "AbortError") {
        console.log("Get current user hook was aborted");
        return null;
      }
      const errorMessage = `Get current user failed: ${err.message}`;
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
    getCurrentUser: getCurrentUserData,
    user,
    loading,
    error,
    abort
  };
}
