// useGlobalDataRefresh.js - Global data refresh manager for smooth system-wide updates
import { useState, useEffect, useCallback, useRef } from 'react';

// Global refresh manager
class GlobalDataRefreshManager {
  constructor() {
    this.refreshCallbacks = new Map();
    this.refreshInterval = null;
    this.isActive = false;
    this.refreshRate = 1000; // 1 second default
  }

  // Register a refresh callback for a specific page/component
  register(key, callback) {
    this.refreshCallbacks.set(key, callback);
  }

  // Unregister a refresh callback
  unregister(key) {
    this.refreshCallbacks.delete(key);
  }

  // Start global refresh system
  start(refreshRate = 1000) {
    if (this.isActive) return;
    
    this.refreshRate = refreshRate;
    this.isActive = true;
    
    this.refreshInterval = setInterval(() => {
      this.refreshAll();
    }, this.refreshRate);
    
  }

  // Stop global refresh system
  stop() {
    if (!this.isActive) return;
    
    this.isActive = false;
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    
  }

  // Refresh all registered callbacks
  refreshAll() {
    if (this.refreshCallbacks.size === 0) return;
    
    
    this.refreshCallbacks.forEach((callback, key) => {
      try {
        callback();
      } catch (error) {
        // Error refreshing data - handled silently
      }
    });
  }

  // Manual refresh for specific component
  refresh(key) {
    const callback = this.refreshCallbacks.get(key);
    if (callback) {
      try {
        callback();
      } catch (error) {
        // Error in manual refresh - handled silently
      }
    }
  }

  // Get current status
  getStatus() {
    return {
      isActive: this.isActive,
      refreshRate: this.refreshRate,
      registeredComponents: Array.from(this.refreshCallbacks.keys()),
      componentCount: this.refreshCallbacks.size
    };
  }
}

// Global instance
const globalRefreshManager = new GlobalDataRefreshManager();

// Hook for components to register with global refresh system
export const useGlobalDataRefresh = (key, refreshCallback, options = {}) => {
  const {
    autoRegister = true,
    refreshRate = 1000,
    startOnMount = true
  } = options;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshCallbackRef = useRef(refreshCallback);

  // Update callback ref when it changes
  useEffect(() => {
    refreshCallbackRef.current = refreshCallback;
  }, [refreshCallback]);

  // Wrapped callback that includes refresh state management
  const wrappedCallback = useCallback(() => {
    if (refreshCallbackRef.current) {
      setIsRefreshing(true);
      try {
        refreshCallbackRef.current();
      } finally {
        // Reset refreshing state after a short delay
        setTimeout(() => setIsRefreshing(false), 100);
      }
    }
  }, []);

  // Register/unregister with global manager
  useEffect(() => {
    if (autoRegister && key) {
      globalRefreshManager.register(key, wrappedCallback);
      
      // Start global refresh system if this is the first component
      if (startOnMount && globalRefreshManager.refreshCallbacks.size === 1) {
        globalRefreshManager.start(refreshRate);
      }
      
      return () => {
        globalRefreshManager.unregister(key);
        
        // Stop global refresh system if this was the last component
        if (globalRefreshManager.refreshCallbacks.size === 0) {
          globalRefreshManager.stop();
        }
      };
    }
  }, [key, autoRegister, wrappedCallback, refreshRate, startOnMount]);

  // Manual refresh function
  const manualRefresh = useCallback(() => {
    globalRefreshManager.refresh(key);
  }, [key]);

  // Get global status
  const getGlobalStatus = useCallback(() => {
    return globalRefreshManager.getStatus();
  }, []);

  return {
    isRefreshing,
    manualRefresh,
    getGlobalStatus
  };
};

// Hook for managing global refresh system
export const useGlobalRefreshManager = () => {
  const [status, setStatus] = useState(globalRefreshManager.getStatus());

  const startGlobalRefresh = useCallback((refreshRate = 1000) => {
    globalRefreshManager.start(refreshRate);
    setStatus(globalRefreshManager.getStatus());
  }, []);

  const stopGlobalRefresh = useCallback(() => {
    globalRefreshManager.stop();
    setStatus(globalRefreshManager.getStatus());
  }, []);

  const refreshAll = useCallback(() => {
    globalRefreshManager.refreshAll();
  }, []);

  const updateStatus = useCallback(() => {
    setStatus(globalRefreshManager.getStatus());
  }, []);

  // Update status periodically
  useEffect(() => {
    const interval = setInterval(updateStatus, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [updateStatus]);

  return {
    status,
    startGlobalRefresh,
    stopGlobalRefresh,
    refreshAll,
    updateStatus
  };
};

// Export the global manager for direct access if needed
export { globalRefreshManager };
