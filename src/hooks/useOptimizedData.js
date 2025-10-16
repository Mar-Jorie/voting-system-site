// useOptimizedData.js - Optimized data loading hook with caching and progressive loading
import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import apiClient from '../usecases/api';
import { useGlobalDataRefresh, globalRefreshManager } from './useGlobalDataRefresh';

// Cache for storing fetched data
const dataCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cache entry structure
class CacheEntry {
  constructor(data, timestamp = Date.now()) {
    this.data = data;
    this.timestamp = timestamp;
  }

  isExpired() {
    return Date.now() - this.timestamp > CACHE_DURATION;
  }
}

// Optimized data loading hook
export const useOptimizedData = (collection, options = {}) => {
  const {
    where = {},
    limit = 100,
    skip = 0,
    sort = {},
    dependencies = [],
    enableCache = true,
    enableProgressiveLoading = true,
    enableGlobalRefresh = true,
    refreshKey = `${collection}_${JSON.stringify(where)}`,
    onSuccess,
    onError
  } = options;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);


  // Global refresh integration
  const { isRefreshing: isGlobalRefreshing, manualRefresh } = useGlobalDataRefresh(
    enableGlobalRefresh ? refreshKey : null,
    null, // Will be set after loadData is defined
    {
      autoRegister: enableGlobalRefresh,
      refreshRate: 5000 // Increased from 1000ms to 5000ms to reduce loop frequency
    }
  );

  // Generate cache key
  const cacheKey = useMemo(() => {
    return `${collection}_${JSON.stringify(where)}_${limit}_${skip}_${JSON.stringify(sort)}`;
  }, [collection, where, limit, skip, sort]);

  // Check if data is cached and valid
  const getCachedData = useCallback(() => {
    if (!enableCache) return null;
    
    const cached = dataCache.get(cacheKey);
    if (cached && !cached.isExpired()) {
      return cached.data;
    }
    
    // Remove expired cache entry
    if (cached) {
      dataCache.delete(cacheKey);
    }
    
    return null;
  }, [cacheKey, enableCache]);

  // Set data in cache
  const setCachedData = useCallback((newData) => {
    if (!enableCache) return;
    
    dataCache.set(cacheKey, new CacheEntry(newData));
  }, [cacheKey, enableCache]);

  // Load data with progressive loading
  const loadData = useCallback(async (isRefresh = false) => {
    try {
      // Check cache first (unless refreshing)
      if (!isRefresh) {
        const cachedData = getCachedData();
        if (cachedData) {
          setData(cachedData);
          setLoading(false);
          return cachedData;
        }
      }

      setLoading(true);
      setError(null);

      // Progressive loading: show UI first, then load data
      if (enableProgressiveLoading && !isRefresh) {
        // Set empty data first to show skeleton
        setData([]);
      }

      // Fetch data from API
      const result = await apiClient.findObjects(collection, where, {
        limit,
        skip,
        sort
      });

      // Update state
      setData(result || []);
      setHasMore(result && result.length === limit);
      setTotalCount(result ? result.length : 0);

      // Cache the result
      setCachedData(result || []);

      // Call success callback
      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (err) {
      const errorMessage = err.message || 'Failed to load data';
      // Error loading data - handled silently
      setError(errorMessage);
      
      // Call error callback
      if (onError) {
        onError(err);
      } else {
        toast.error(errorMessage);
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [
    collection,
    where,
    limit,
    skip,
    sort,
    enableProgressiveLoading,
    getCachedData,
    setCachedData,
    onSuccess,
    onError
  ]);

  // Update global refresh callback after loadData is defined
  useEffect(() => {
    if (enableGlobalRefresh && refreshKey) {
      // Re-register with the actual loadData function
      globalRefreshManager.unregister(refreshKey);
      globalRefreshManager.register(refreshKey, () => loadData(true));
    }
    
    return () => {
      if (enableGlobalRefresh && refreshKey) {
        globalRefreshManager.unregister(refreshKey);
      }
    };
  }, [enableGlobalRefresh, refreshKey]); // Removed loadData from dependencies to prevent re-registration

  // Load more data (for pagination)
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    try {
      setLoading(true);
      const newData = await apiClient.findObjects(collection, where, {
        limit,
        skip: data.length,
        sort
      });

      if (newData && newData.length > 0) {
        const updatedData = [...data, ...newData];
        setData(updatedData);
        setHasMore(newData.length === limit);
        setCachedData(updatedData);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      toast.error('Failed to load more data');
    } finally {
      setLoading(false);
    }
  }, [collection, where, limit, sort, data, loading, hasMore, setCachedData]);

  // Refresh data
  const refresh = useCallback(() => {
    return loadData(true);
  }, [loadData]);

  // Clear cache
  const clearCache = useCallback(() => {
    dataCache.delete(cacheKey);
  }, [cacheKey]);

  // Load data on mount and when dependencies change
  useEffect(() => {
    loadData();
  }, [loadData, ...dependencies]);

  return {
    data,
    loading,
    error,
    hasMore,
    totalCount,
    loadMore,
    refresh,
    clearCache,
    isGlobalRefreshing,
    manualRefresh
  };
};

// Optimized dashboard data hook with real-time updates
export const useOptimizedDashboardData = () => {
  const [metrics, setMetrics] = useState({
    totalVoters: 0,
    totalCandidates: 0,
    totalFaqs: 0,
    totalSiteVisitors: 0
  });
  const [candidates, setCandidates] = useState([]);
  const [votes, setVotes] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load dashboard data progressively
  const loadDashboardData = useCallback(async (isRefresh = false) => {
    try {
      // Only show loading spinner on initial load, not on refreshes
      if (!isRefresh) {
        setLoading(true);
      } else {
        // Show subtle refresh indicator for auto-refresh
        setIsRefreshing(true);
      }
      setError(null);

      // Load candidates first (most important)
      const candidatesData = await apiClient.findObjects('candidates', {});
      setCandidates(candidatesData || []);

      // Load votes, FAQs, site visitors, and audit logs in parallel
      const [votesData, faqsData, siteVisitorsData, auditLogsData] = await Promise.all([
        apiClient.findObjects('votes', {}),
        apiClient.findObjects('faqs', {}),
        apiClient.findObjects('site_visitors', {}),
        apiClient.findObjects('audit_logs', {}, { 
          limit: 20, 
          sort: { created: -1 } 
        })
      ]);

      setVotes(votesData || []);
      setAuditLogs(auditLogsData || []);

      // Calculate metrics
      const totalVoters = votesData ? votesData.length : 0;
      const totalCandidates = candidatesData ? candidatesData.length : 0;
      const totalFaqs = faqsData ? faqsData.length : 0;
      const totalSiteVisitors = siteVisitorsData ? siteVisitorsData.length : 0;

      setMetrics({
        totalVoters,
        totalCandidates,
        totalFaqs,
        totalSiteVisitors
      });

      // Update last updated timestamp
      setLastUpdated(new Date());

    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
      // Only show toast error on initial load or manual refresh, not on auto-refresh
      if (!isRefresh) {
        toast.error('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Global refresh integration
  const { isRefreshing: isGlobalRefreshing, manualRefresh } = useGlobalDataRefresh(
    'dashboard_page',
    useCallback(() => {
      loadDashboardData(true); // true indicates this is a refresh
    }, []), // Remove loadDashboardData from dependencies
    {
      autoRegister: true,
      refreshRate: 5000 // Increased from 1000ms to 5000ms to reduce loop frequency
    }
  );

  // Initial load
  useEffect(() => {
    loadDashboardData();
  }, []); // Remove loadDashboardData from dependencies to prevent loop

  // Listen for real-time events
  useEffect(() => {
    const handleVotesUpdated = () => {
      loadDashboardData(true);
    };
    
    const handleCandidatesUpdated = () => {
      loadDashboardData(true);
    };

    const handleAuditLogsUpdated = () => {
      loadDashboardData(true);
    };

    // Listen for custom events
    window.addEventListener('votesUpdated', handleVotesUpdated);
    window.addEventListener('candidatesUpdated', handleCandidatesUpdated);
    window.addEventListener('auditLogsUpdated', handleAuditLogsUpdated);
    
    return () => {
      window.removeEventListener('votesUpdated', handleVotesUpdated);
      window.removeEventListener('candidatesUpdated', handleCandidatesUpdated);
      window.removeEventListener('auditLogsUpdated', handleAuditLogsUpdated);
    };
  }, []); // Remove loadDashboardData from dependencies to prevent loop

  return {
    metrics,
    candidates,
    votes,
    auditLogs,
    loading,
    error,
    lastUpdated,
    isRefreshing: isRefreshing || isGlobalRefreshing,
    refresh: () => loadDashboardData(true),
    manualRefresh
  };
};

// Optimized candidates data hook
export const useOptimizedCandidatesData = (options = {}) => {
  return useOptimizedData('candidates', {
    enableGlobalRefresh: false, // Disabled to prevent loops
    refreshKey: 'candidates_page',
    enableCache: true, // Enable caching to reduce API calls
    enableProgressiveLoading: false, // Disable progressive loading to prevent state issues
    ...options
  });
};

// Data prefetching hook
export const useDataPrefetch = () => {
  const prefetchData = useCallback(async (collection, where = {}, options = {}) => {
    try {
      const result = await apiClient.findObjects(collection, where, options);
      const cacheKey = `${collection}_${JSON.stringify(where)}_${JSON.stringify(options)}`;
      dataCache.set(cacheKey, new CacheEntry(result));
      return result;
    } catch (err) {
      // Failed to prefetch - handled silently
    }
  }, []);

  return { prefetchData };
};

// Clear all cache
export const clearAllCache = () => {
  dataCache.clear();
};

// Get cache statistics
export const getCacheStats = () => {
  const stats = {
    size: dataCache.size,
    entries: Array.from(dataCache.entries()).map(([key, entry]) => ({
      key,
      timestamp: entry.timestamp,
      isExpired: entry.isExpired()
    }))
  };
  return stats;
};

export default useOptimizedData;