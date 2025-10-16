import { useState, useCallback, useRef } from "react";
import { signIn } from "../api.js";
import auditLogger from "../../utils/auditLogger.js";

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
      
      // Log successful login
      await auditLogger.logLogin(credentials.email);
      
      return response;
    } catch (err) {
      if (err.name === "AbortError") {
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
