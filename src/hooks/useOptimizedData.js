// useOptimizedData.js - Optimized data loading hook with caching and progressive loading
import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import apiClient from '../usecases/api';

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
    onSuccess,
    onError
  } = options;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

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
  }, dependencies);

  return {
    data,
    loading,
    error,
    hasMore,
    totalCount,
    loadMore,
    refresh,
    clearCache
  };
};

// Optimized dashboard data hook
export const useOptimizedDashboardData = () => {
  const [metrics, setMetrics] = useState({
    totalCandidates: 0,
    totalVotes: 0,
    totalUsers: 0,
    activeVoters: 0
  });
  const [candidates, setCandidates] = useState([]);
  const [votes, setVotes] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load dashboard data progressively
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load candidates first (most important)
      const candidatesData = await apiClient.findObjects('candidates', {});
      setCandidates(candidatesData || []);

      // Load votes in parallel with audit logs
      const [votesData, auditLogsData] = await Promise.all([
        apiClient.findObjects('votes', {}),
        apiClient.findObjects('audit_logs', {}, { 
          limit: 20, 
          sort: { created: -1 } 
        })
      ]);

      setVotes(votesData || []);
      setAuditLogs(auditLogsData || []);

      // Calculate metrics
      const totalCandidates = candidatesData ? candidatesData.length : 0;
      const totalVotes = votesData ? votesData.length : 0;
      const totalUsers = await apiClient.countObjects('users', {});
      const activeVoters = votesData ? new Set(votesData.map(vote => vote.user_id)).size : 0;

      setMetrics({
        totalCandidates,
        totalVotes,
        totalUsers,
        activeVoters
      });

    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, []);

  return {
    metrics,
    candidates,
    votes,
    auditLogs,
    loading,
    error,
    refresh: loadDashboardData
  };
};

// Optimized candidates data hook
export const useOptimizedCandidatesData = (filters = {}) => {
  const [candidates, setCandidates] = useState([]);
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Stabilize filters object to prevent infinite re-renders
  const stableFilters = useMemo(() => filters, [JSON.stringify(filters)]);

  // Load candidates with votes
  const loadCandidatesData = useCallback(async () => {
    try {
      console.log('🔄 Starting to load candidates data...');
      setLoading(true);
      setError(null);

      // Load candidates first
      console.log('📡 Making API call to fetch candidates...');
      const candidatesData = await apiClient.findObjects('candidates', stableFilters);
      console.log('✅ API call successful, candidates data:', candidatesData);
      setCandidates(candidatesData || []);

      // Load votes for vote count calculation
      const votesData = await apiClient.findObjects('votes', {});
      setVotes(votesData || []);

      // Calculate vote counts for each candidate
      if (candidatesData && votesData) {
        const candidatesWithVotes = candidatesData.map(candidate => {
          const candidateVotes = votesData.filter(vote => vote.candidate_id === candidate.id);
          return {
            ...candidate,
            voteCount: candidateVotes.length
          };
        });
        setCandidates(candidatesWithVotes);
      }

    } catch (err) {
      console.error('❌ Error loading candidates data:', err);
      console.error('❌ Error type:', typeof err);
      console.error('❌ Error message:', err.message);
      const errorMessage = err.message || 'Failed to load candidates data';
      console.log('🔧 Setting error state:', errorMessage);
      setError(errorMessage);
      
      // Show more specific error messages
      if (err.message?.includes('403') || err.message?.includes('Unauthorized')) {
        console.log('🚫 403/Unauthorized error detected');
        toast.error('API access denied. Please check your credentials.');
      } else if (err.message?.includes('Network') || err.message?.includes('fetch')) {
        console.log('🌐 Network error detected');
        toast.error('Network error. Please check your connection.');
      } else {
        console.log('❓ Generic error detected');
        toast.error('Failed to load candidates data');
      }
    } finally {
      console.log('🏁 Setting loading to false');
      setLoading(false);
    }
  }, [stableFilters]);

  useEffect(() => {
    loadCandidatesData();
  }, [loadCandidatesData]);

  return {
    candidates,
    votes,
    loading,
    error,
    refresh: loadCandidatesData
  };
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
      console.warn(`Failed to prefetch ${collection}:`, err);
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