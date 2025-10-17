// Notification Service for managing real-time notifications
import { toast } from 'react-hot-toast';
import apiClient from '../usecases/api';

class NotificationService {
  constructor() {
    this.notifications = [];
    this.listeners = [];
    this.voteCount = 0;
    this.votingStatus = null;
    this.deadlineCheckInterval = null;
    this.voteCheckInterval = null;
    this.isInitialized = false;
    this.recentNotifications = new Map(); // Track recent notifications to prevent duplicates
    this.monitoringActive = false; // Prevent multiple monitoring instances
  }

  // Add notification listener
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Notify all listeners
  notifyListeners() {
    this.listeners.forEach(listener => listener([...this.notifications]));
  }

  // Initialize notification service
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      console.log('Initializing notification service...');
      await this.loadNotificationsFromDatabase();
      this.isInitialized = true;
      console.log('Notification service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
      // Continue with empty notifications if database fails
    }
  }

  // Load notifications from database
  async loadNotificationsFromDatabase() {
    try {
      // Check if apiClient is available
      if (!apiClient || typeof apiClient.findObjects !== 'function') {
        throw new Error('API client not available');
      }
      
      // Fetch global notifications (not per-user) from database
      const notifications = await apiClient.findObjects('notifications', {}, {
        sort: { created: -1 },
        limit: 50
      });
      
      this.notifications = notifications || [];
      this.notifyListeners();
      console.log('Successfully loaded global notifications from database:', this.notifications.length);
      console.log('Sample notification:', this.notifications[0]);
      console.log('Unread notifications:', this.notifications.filter(n => n.unread).length);
    } catch (error) {
      console.error('Failed to load notifications from database:', error);
      // No localStorage fallback - use empty array if database fails
      this.notifications = [];
      this.notifyListeners();
    }
  }

  // Save notification to database
  async saveNotificationToDatabase(notification) {
    try {
      // Check if apiClient is available
      if (!apiClient || typeof apiClient.createObject !== 'function') {
        throw new Error('API client not available');
      }
      
      // Create global notification (not per-user)
      const savedNotification = await apiClient.createObject('notifications', {
        title: notification.title,
        message: notification.message,
        type: notification.type,
        action: notification.action,
        priority: notification.priority || 'normal',
        unread: notification.unread !== false
        // Removed user_id to make notifications global
      });
      
      console.log('Successfully saved global notification to database:', savedNotification.id);
      return savedNotification;
    } catch (error) {
      console.error('Failed to save notification to database:', error);
      // No localStorage fallback - throw error if database save fails
      throw error;
    }
  }

  // Add a new notification
  async addNotification(notification) {
    try {
      // Create a unique key for this notification
      const notificationKey = `${notification.title}-${notification.message}`;
      const now = Date.now();
      
      // Check if we've already created this notification recently (within 60 seconds)
      if (this.recentNotifications.has(notificationKey)) {
        const lastCreated = this.recentNotifications.get(notificationKey);
        if (now - lastCreated < 60000) { // 60 seconds
          console.log('Duplicate notification prevented:', notification.title);
          return null;
        }
      }
      
      // Mark this notification as recently created
      this.recentNotifications.set(notificationKey, now);
      
      // Clean up old entries (older than 5 minutes)
      for (const [key, timestamp] of this.recentNotifications.entries()) {
        if (now - timestamp > 300000) { // 5 minutes
          this.recentNotifications.delete(key);
        }
      }

      const newNotification = {
        unread: true,
        ...notification
      };

      // Save to database only
      const savedNotification = await this.saveNotificationToDatabase(newNotification);
      
      // Reload notifications from database to get the latest state
      await this.loadNotificationsFromDatabase();
      
      // Show toast notification for important events (only for new notifications, not duplicates)
      if (notification.priority === 'high' && savedNotification) {
        toast.success(notification.title, {
          duration: 4000
        });
      }
      
      return savedNotification;
    } catch (error) {
      console.error('Failed to add notification:', error);
      // Don't add to local state if database save fails
      throw error;
    }
  }


  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      // Update in database
      await this.markNotificationAsRead(notificationId);
      
      // Reload notifications from database to get the latest state
      await this.loadNotificationsFromDatabase();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  }


  // Get unread count
  getUnreadCount() {
    return this.notifications.filter(n => n.unread).length;
  }

  // Mark notification as read in database
  async markNotificationAsRead(notificationId) {
    try {
      // Check if apiClient is available
      if (!apiClient || typeof apiClient.updateObject !== 'function') {
        throw new Error('API client not available');
      }
      
      await apiClient.updateObject('notifications', notificationId, {
        unread: false
      });
      console.log('Successfully marked notification as read in database:', notificationId);
    } catch (error) {
      console.error('Failed to mark notification as read in database:', error);
      // No localStorage fallback - throw error if database update fails
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllAsRead() {
    try {
      const unreadNotifications = this.notifications.filter(n => n.unread);
      
      // Update in database
      for (const notification of unreadNotifications) {
        if (notification.id) {
          await this.markNotificationAsRead(notification.id);
        }
      }
      
      // Reload notifications from database to get the latest state
      await this.loadNotificationsFromDatabase();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  // Start monitoring for new votes
  startVoteMonitoring(apiClientParam) {
    if (this.voteCheckInterval) {
      clearInterval(this.voteCheckInterval);
    }

    this.voteCheckInterval = setInterval(async () => {
      try {
        // Use the passed apiClient parameter or fall back to imported one
        const client = apiClientParam || apiClient;
        if (!client || typeof client.findObjects !== 'function') {
          console.log('API client not available for vote monitoring');
          return;
        }

        const votes = await client.findObjects('votes', {});
        const currentVoteCount = votes.length;

        if (currentVoteCount > this.voteCount) {
          const newVotesCount = currentVoteCount - this.voteCount;
          this.voteCount = currentVoteCount;

          await this.addNotification({
            title: "New Vote Submitted",
            message: `${newVotesCount} new vote${newVotesCount > 1 ? 's' : ''} submitted`,
            type: "vote",
            action: "view_votes",
            priority: "high"
          });
        }
      } catch (error) {
        console.error('Error monitoring votes:', error);
      }
    }, 5000); // Check every 5 seconds
  }

  // Start monitoring voting status and deadlines
  startVotingStatusMonitoring(apiClientParam) {
    if (this.deadlineCheckInterval) {
      clearInterval(this.deadlineCheckInterval);
    }

    this.deadlineCheckInterval = setInterval(async () => {
      try {
        // Use the passed apiClient parameter or fall back to imported one
        const client = apiClientParam || apiClient;
        if (!client || typeof client.findObjects !== 'function') {
          console.log('API client not available for voting status monitoring');
          return;
        }

        const votingStatus = await client.findObjects('voting_sessions', {});
        const currentStatus = votingStatus[0];

        if (currentStatus) {
          // Check if voting status changed
          if (this.votingStatus && this.votingStatus.is_active !== currentStatus.is_active) {
            if (currentStatus.is_active) {
              await this.addNotification({
                title: "Voting Started",
                message: "Voting is now active and accepting votes",
                type: "voting",
                action: "view_dashboard",
                priority: "high"
              });
            } else {
              await this.addNotification({
                title: "Voting Ended",
                message: "Voting has been stopped and is no longer accepting votes",
                type: "voting",
                action: "view_dashboard",
                priority: "high"
              });
            }
          }

          // Check deadline notifications
          if (currentStatus.end_date) {
            const deadline = new Date(currentStatus.end_date);
            const now = new Date();
            const timeUntilDeadline = deadline.getTime() - now.getTime();

            // Notify 1 hour before deadline
            if (timeUntilDeadline > 0 && timeUntilDeadline <= 3600000 && timeUntilDeadline > 3300000) {
              this.addNotification({
                title: "Voting Deadline Reminder",
                message: "Voting will end in 1 hour. Make sure to cast your vote!",
                type: "deadline",
                action: "view_candidates",
                priority: "high"
              });
            }

            // Notify 15 minutes before deadline
            if (timeUntilDeadline > 0 && timeUntilDeadline <= 900000 && timeUntilDeadline > 600000) {
              this.addNotification({
                title: "Voting Deadline Warning",
                message: "Voting will end in 15 minutes. Last chance to vote!",
                type: "deadline",
                action: "view_candidates",
                priority: "high"
              });
            }

            // Notify when deadline is reached
            if (timeUntilDeadline <= 0 && this.votingStatus && this.votingStatus.autoStopDate) {
              this.addNotification({
                title: "Voting Deadline Reached",
                message: "The voting deadline has been reached and voting has ended",
                type: "deadline",
                action: "view_dashboard",
                priority: "high"
              });
            }
          }

          this.votingStatus = currentStatus;
        }
      } catch (error) {
        console.error('Error monitoring voting status:', error);
      }
    }, 10000); // Check every 10 seconds
  }

  // Stop monitoring
  stopMonitoring() {
    if (this.voteCheckInterval) {
      clearInterval(this.voteCheckInterval);
      this.voteCheckInterval = null;
    }
    if (this.deadlineCheckInterval) {
      clearInterval(this.deadlineCheckInterval);
      this.deadlineCheckInterval = null;
    }
    this.monitoringActive = false;
  }

  // Initialize monitoring with API client
  async initializeMonitoring(apiClient) {
    try {
      // Prevent multiple monitoring instances
      if (this.monitoringActive) {
        console.log('Monitoring already active, skipping initialization');
        return;
      }

      // Get initial vote count
      const votes = await apiClient.findObjects('votes', {});
      this.voteCount = votes.length;

      // Get initial voting status
      const votingStatus = await apiClient.findObjects('voting_sessions', {});
      this.votingStatus = votingStatus[0];

      // Start monitoring
      this.startVoteMonitoring(apiClient);
      this.startVotingStatusMonitoring(apiClient);
      
      this.monitoringActive = true;

      console.log('Notification service monitoring initialized');
    } catch (error) {
      console.error('Error initializing notification service monitoring:', error);
    }
  }

  // Add deadline set notification
  notifyDeadlineSet(deadlineDate) {
    const deadline = new Date(deadlineDate);
    const formattedDate = deadline.toLocaleString();
    
    this.addNotification({
      title: "Voting Deadline Set",
      message: `Voting will automatically end on ${formattedDate}`,
      type: "deadline",
      action: "view_dashboard",
      priority: "high"
    });
  }

  // Add deadline cleared notification
  notifyDeadlineCleared() {
    this.addNotification({
      title: "Voting Deadline Cleared",
      message: "The automatic voting deadline has been removed",
      type: "deadline",
      action: "view_dashboard",
      priority: "medium"
    });
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;
