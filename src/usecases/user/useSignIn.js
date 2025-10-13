import { useState, useCallback, useRef } from "react";
import { signIn } from "../api.js";

export function useSignIn() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const signInUser = useCallback(async (credentials, options = {}) => {
    setLoading(true);
    setError(null);
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    try {
      const response = await signIn(credentials, {
        signal: abortControllerRef.current.signal,
        ...options,
      });
      setUser(response.user);
      return response;
    } catch (err) {
      if (err.name === "AbortError") {
        console.log("Sign in hook was aborted");
        return null;
      }
      const errorMessage = `Sign in failed: ${err.message}`;
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
    signIn: signInUser,
    user,
    loading,
    error,
    abort
  };
}
