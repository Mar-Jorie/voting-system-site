import { useState, useCallback, useRef } from "react";
import { signUp } from "../api.js";

export function useSignUp() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const signUpUser = useCallback(async (userData, options = {}) => {
    setLoading(true);
    setError(null);
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    try {
      const response = await signUp(userData, {
        signal: abortControllerRef.current.signal,
        ...options,
      });
      setUser(response);
      return response;
    } catch (err) {
      if (err.name === "AbortError") {
        console.log("Sign up hook was aborted");
        return null;
      }
      const errorMessage = `Sign up failed: ${err.message}`;
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
    signUp: signUpUser,
    user,
    loading,
    error,
    abort
  };
}
