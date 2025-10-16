// Visitor Tracking Utility Functions
// This file provides utility functions for testing and monitoring visitor tracking

import apiClient from '../usecases/api';

/**
 * Get visitor statistics from the database
 * @returns {Promise<Object>} Visitor statistics
 */
export const getVisitorStats = async () => {
  try {
    const visitors = await apiClient.findObjects('site_visitors', {});
    
    const stats = {
      totalVisitors: visitors.length,
      uniqueVisitors: visitors.filter(v => v.is_unique_visitor).length,
      totalVisits: visitors.reduce((sum, v) => sum + (v.visit_count || 1), 0),
      averageVisitsPerVisitor: 0,
      recentVisitors: visitors
        .sort((a, b) => new Date(b.last_visit_timestamp || b.created) - new Date(a.last_visit_timestamp || a.created))
        .slice(0, 5)
    };
    
    if (stats.totalVisitors > 0) {
      stats.averageVisitsPerVisitor = (stats.totalVisits / stats.totalVisitors).toFixed(2);
    }
    
    return stats;
  } catch (error) {
    console.error('Error getting visitor stats:', error);
    return null;
  }
};

/**
 * Get visitor by device fingerprint
 * @param {string} deviceFingerprint - The device fingerprint to search for
 * @returns {Promise<Object|null>} Visitor record or null
 */
export const getVisitorByFingerprint = async (deviceFingerprint) => {
  try {
    const visitors = await apiClient.findObjects('site_visitors', {
      device_fingerprint: deviceFingerprint
    });
    
    return visitors.length > 0 ? visitors[0] : null;
  } catch (error) {
    console.error('Error getting visitor by fingerprint:', error);
    return null;
  }
};

/**
 * Create a test device fingerprint (for testing purposes)
 * @returns {string} Test device fingerprint
 */
export const createTestFingerprint = () => {
  const testData = [
    'TestUserAgent',
    'en-US',
    '1920',
    '1080',
    '24',
    'TestPlatform',
    'true',
    '1',
    '-480',
    '8',
    '0',
    '2'
  ].join('|');
  
  return btoa(testData).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
};

/**
 * Clear all visitor tracking data (for testing purposes)
 * WARNING: This will delete all visitor records!
 */
export const clearAllVisitors = async () => {
  try {
    const visitors = await apiClient.findObjects('site_visitors', {});
    
    for (const visitor of visitors) {
      await apiClient.deleteObject('site_visitors', visitor.id);
    }
    
    return visitors.length;
  } catch (error) {
    console.error('Error clearing visitors:', error);
    return 0;
  }
};

/**
 * Test visitor tracking functionality
 * This function simulates a visitor tracking scenario
 */
export const testVisitorTracking = async () => {
  
  try {
    // Get initial stats
    const initialStats = await getVisitorStats();
    
    // Create a test fingerprint
    const testFingerprint = createTestFingerprint();
    
    // Check if test visitor exists
    const existingVisitor = await getVisitorByFingerprint(testFingerprint);
    
    if (existingVisitor) {
      // Test visitor exists
    } else {
      // Test visitor does not exist - would create new record
    }
    
    // Get final stats
    const finalStats = await getVisitorStats();
    
    return {
      success: true,
      initialStats,
      finalStats,
      testFingerprint,
      existingVisitor
    };
  } catch (error) {
    console.error('❌ Test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Make functions available in browser console for testing
if (typeof window !== 'undefined') {
  window.visitorTracking = {
    getVisitorStats,
    getVisitorByFingerprint,
    createTestFingerprint,
    clearAllVisitors,
    testVisitorTracking
  };
}
