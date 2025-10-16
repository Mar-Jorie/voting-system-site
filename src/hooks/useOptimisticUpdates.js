// useOptimisticUpdates.js - Hook for optimistic updates to improve UX
import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

// Optimistic update hook
export const useOptimisticUpdates = (initialData = []) => {
  const [data, setData] = useState(initialData);
  const [pendingUpdates, setPendingUpdates] = useState(new Map());

  // Optimistic update function
  const optimisticUpdate = useCallback(async (
    updateFn,
    optimisticData,
    rollbackFn,
    successMessage = 'Update successful',
    errorMessage = 'Update failed'
  ) => {
    const updateId = Date.now().toString();
    
    try {
      // Apply optimistic update immediately
      setData(prevData => {
        const newData = updateFn(prevData, optimisticData);
        setPendingUpdates(prev => new Map(prev).set(updateId, {
          originalData: prevData,
          optimisticData,
          rollbackFn
        }));
        return newData;
      });

      // Show success message immediately
      toast.success(successMessage);

      // Perform actual update
      await updateFn(data, optimisticData);

      // Remove from pending updates
      setPendingUpdates(prev => {
        const newMap = new Map(prev);
        newMap.delete(updateId);
        return newMap;
      });

    } catch (error) {
      // Rollback optimistic update
      setData(prevData => {
        const pending = pendingUpdates.get(updateId);
        if (pending && pending.rollbackFn) {
          return pending.rollbackFn(prevData, pending.originalData);
        }
        return prevData;
      });

      // Remove from pending updates
      setPendingUpdates(prev => {
        const newMap = new Map(prev);
        newMap.delete(updateId);
        return newMap;
      });

      // Show error message
      toast.error(errorMessage);
      throw error;
    }
  }, [data, pendingUpdates]);

  // Optimistic create function
  const optimisticCreate = useCallback(async (
    createFn,
    newItem,
    successMessage = 'Item created successfully',
    errorMessage = 'Failed to create item'
  ) => {
    const updateId = Date.now().toString();
    const tempId = `temp_${updateId}`;
    
    try {
      // Add item optimistically with temporary ID
      const optimisticItem = { ...newItem, id: tempId, _isOptimistic: true };
      
      setData(prevData => {
        const newData = [...prevData, optimisticItem];
        setPendingUpdates(prev => new Map(prev).set(updateId, {
          originalData: prevData,
          optimisticData: optimisticItem,
          rollbackFn: (currentData) => currentData.filter(item => item.id !== tempId)
        }));
        return newData;
      });

      toast.success(successMessage);

      // Perform actual create
      const createdItem = await createFn(newItem);

      // Replace temporary item with real item
      setData(prevData => 
        prevData.map(item => 
          item.id === tempId ? { ...createdItem, _isOptimistic: false } : item
        )
      );

      // Remove from pending updates
      setPendingUpdates(prev => {
        const newMap = new Map(prev);
        newMap.delete(updateId);
        return newMap;
      });

      return createdItem;

    } catch (error) {
      // Rollback optimistic create
      setData(prevData => prevData.filter(item => item.id !== tempId));

      // Remove from pending updates
      setPendingUpdates(prev => {
        const newMap = new Map(prev);
        newMap.delete(updateId);
        return newMap;
      });

      toast.error(errorMessage);
      throw error;
    }
  }, []);

  // Optimistic delete function
  const optimisticDelete = useCallback(async (
    deleteFn,
    itemId,
    successMessage = 'Item deleted successfully',
    errorMessage = 'Failed to delete item'
  ) => {
    const updateId = Date.now().toString();
    
    try {
      // Store original item for rollback
      const originalItem = data.find(item => item.id === itemId);
      
      // Remove item optimistically
      setData(prevData => {
        const newData = prevData.filter(item => item.id !== itemId);
        setPendingUpdates(prev => new Map(prev).set(updateId, {
          originalData: prevData,
          optimisticData: originalItem,
          rollbackFn: (currentData) => {
            const insertIndex = prevData.findIndex(item => item.id === itemId);
            const newData = [...currentData];
            newData.splice(insertIndex, 0, originalItem);
            return newData;
          }
        }));
        return newData;
      });

      toast.success(successMessage);

      // Perform actual delete
      await deleteFn(itemId);

      // Remove from pending updates
      setPendingUpdates(prev => {
        const newMap = new Map(prev);
        newMap.delete(updateId);
        return newMap;
      });

    } catch (error) {
      // Rollback optimistic delete
      setData(prevData => {
        const pending = pendingUpdates.get(updateId);
        if (pending && pending.rollbackFn) {
          return pending.rollbackFn(prevData, pending.originalData);
        }
        return prevData;
      });

      // Remove from pending updates
      setPendingUpdates(prev => {
        const newMap = new Map(prev);
        newMap.delete(updateId);
        return newMap;
      });

      toast.error(errorMessage);
      throw error;
    }
  }, [data]);

  // Optimistic vote function
  const optimisticVote = useCallback(async (
    voteFn,
    candidateId,
    userId,
    successMessage = 'Vote recorded successfully',
    errorMessage = 'Failed to record vote'
  ) => {
    const updateId = Date.now().toString();
    
    try {
      // Update vote count optimistically
      setData(prevData => 
        prevData.map(candidate => 
          candidate.id === candidateId 
            ? { 
                ...candidate, 
                voteCount: (candidate.voteCount || 0) + 1,
                _hasVoted: true,
                _isOptimisticVote: true
              }
            : candidate
        )
      );

      setPendingUpdates(prev => new Map(prev).set(updateId, {
        originalData: data,
        optimisticData: { candidateId, userId },
        rollbackFn: (currentData) => 
          currentData.map(candidate => 
            candidate.id === candidateId 
              ? { 
                  ...candidate, 
                  voteCount: Math.max((candidate.voteCount || 0) - 1, 0),
                  _hasVoted: false,
                  _isOptimisticVote: false
                }
              : candidate
          )
      }));

      toast.success(successMessage);

      // Perform actual vote
      await voteFn(candidateId, userId);

      // Remove optimistic flag
      setData(prevData => 
        prevData.map(candidate => 
          candidate.id === candidateId 
            ? { ...candidate, _isOptimisticVote: false }
            : candidate
        )
      );

      // Remove from pending updates
      setPendingUpdates(prev => {
        const newMap = new Map(prev);
        newMap.delete(updateId);
        return newMap;
      });

    } catch (error) {
      // Rollback optimistic vote
      setData(prevData => {
        const pending = pendingUpdates.get(updateId);
        if (pending && pending.rollbackFn) {
          return pending.rollbackFn(prevData, pending.originalData);
        }
        return prevData;
      });

      // Remove from pending updates
      setPendingUpdates(prev => {
        const newMap = new Map(prev);
        newMap.delete(updateId);
        return newMap;
      });

      toast.error(errorMessage);
      throw error;
    }
  }, [data]);

  // Get pending updates count
  const getPendingUpdatesCount = useCallback(() => {
    return pendingUpdates.size;
  }, [pendingUpdates]);

  // Check if item has pending updates
  const hasPendingUpdates = useCallback((itemId) => {
    return Array.from(pendingUpdates.values()).some(
      update => update.optimisticData.id === itemId
    );
  }, [pendingUpdates]);

  // Clear all pending updates
  const clearPendingUpdates = useCallback(() => {
    setPendingUpdates(new Map());
  }, []);

  return {
    data,
    setData,
    optimisticUpdate,
    optimisticCreate,
    optimisticDelete,
    optimisticVote,
    getPendingUpdatesCount,
    hasPendingUpdates,
    clearPendingUpdates,
    pendingUpdatesCount: pendingUpdates.size
  };
};

export default useOptimisticUpdates;
