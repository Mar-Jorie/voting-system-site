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
      await this.loadNotificationsFromDatabase();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
      // Continue with empty notifications if database fails
    }
  }

  // Load notifications from database
  async loadNotificationsFromDatabase() {
    try {
      const notifications = await apiClient.findObjects('notifications', {
        order: '-created',
        limit: 50
      });
      
      this.notifications = notifications || [];
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to load notifications from database:', error);
      console.log('Notifications collection may not exist yet. Using local storage fallback.');
      
      // Fallback to localStorage for persistence
      try {
        const storedNotifications = localStorage.getItem('voting_notifications');
        if (storedNotifications) {
          this.notifications = JSON.parse(storedNotifications);
          this.notifyListeners();
        } else {
          this.notifications = [];
        }
      } catch (storageError) {
        console.error('Failed to load notifications from localStorage:', storageError);
        this.notifications = [];
      }
    }
  }

  // Save notification to database
  async saveNotificationToDatabase(notification) {
    try {
      const savedNotification = await apiClient.createObject('notifications', {
        title: notification.title,
        message: notification.message,
        type: notification.type,
        action: notification.action,
        priority: notification.priority || 'normal',
        unread: notification.unread !== false,
        user_id: notification.user_id || null
      });
      
      return savedNotification;
    } catch (error) {
      console.error('Failed to save notification to database:', error);
      console.log('Notifications collection may not exist yet. Using localStorage fallback.');
      
      // Fallback to localStorage for persistence
      try {
        const notificationWithId = {
          ...notification,
          id: notification.id || Date.now() + Math.random(),
          created: notification.timestamp || new Date().toISOString()
        };
        
        // Save to localStorage
        const existingNotifications = JSON.parse(localStorage.getItem('voting_notifications') || '[]');
        existingNotifications.unshift(notificationWithId);
        
        // Keep only last 50 notifications
        const trimmedNotifications = existingNotifications.slice(0, 50);
        localStorage.setItem('voting_notifications', JSON.stringify(trimmedNotifications));
        
        return notificationWithId;
      } catch (storageError) {
        console.error('Failed to save notification to localStorage:', storageError);
        return notification; // Return original if all saves fail
      }
    }
  }

  // Add a new notification
  async addNotification(notification) {
    const newNotification = {
      id: Date.now() + Math.random(),
      timestamp: new Date(),
      unread: true,
      ...notification
    };

    // Save to database
    const savedNotification = await this.saveNotificationToDatabase(newNotification);
    
    // Use saved notification if successful, otherwise use local one
    const finalNotification = savedNotification.id ? savedNotification : newNotification;

    this.notifications.unshift(finalNotification);
    
    // Keep only last 50 notifications
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }

    this.notifyListeners();
    
    // Show toast notification for important events
    if (notification.priority === 'high') {
      toast.success(notification.title, {
        duration: 4000,
        icon: this.getNotificationIcon(notification.type)
      });
    }
    
    return finalNotification;
  }

  // Get notification icon based on type
  getNotificationIcon(type) {
    switch (type) {
      case 'vote':
        return '🗳️';
      case 'deadline':
        return '⏰';
      case 'voting':
        return '📊';
      case 'system':
        return '⚙️';
      default:
        return '📢';
    }
  }

  // Mark notification as read
  markAsRead(notificationId) {
    this.notifications = this.notifications.map(notification =>
      notification.id === notificationId
        ? { ...notification, unread: false }
        : notification
    );
    this.notifyListeners();
  }

  // Mark all notifications as read
  markAllAsRead() {
    this.notifications = this.notifications.map(notification => ({
      ...notification,
      unread: false
    }));
    this.notifyListeners();
  }

  // Get unread count
  getUnreadCount() {
    return this.notifications.filter(n => n.unread).length;
  }

  // Mark notification as read in database
  async markNotificationAsRead(notificationId) {
    try {
      await apiClient.updateObject('notifications', notificationId, {
        unread: false
      });
    } catch (error) {
      console.error('Failed to mark notification as read in database:', error);
      console.log('Using localStorage fallback for marking as read.');
      
      // Fallback to localStorage
      try {
        const existingNotifications = JSON.parse(localStorage.getItem('voting_notifications') || '[]');
        const updatedNotifications = existingNotifications.map(notification => 
          notification.id === notificationId 
            ? { ...notification, unread: false }
            : notification
        );
        localStorage.setItem('voting_notifications', JSON.stringify(updatedNotifications));
      } catch (storageError) {
        console.error('Failed to mark notification as read in localStorage:', storageError);
      }
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
      
      // Update local state
      this.notifications = this.notifications.map(n => ({ ...n, unread: false }));
      
      // Update localStorage as well
      try {
        const existingNotifications = JSON.parse(localStorage.getItem('voting_notifications') || '[]');
        const updatedNotifications = existingNotifications.map(notification => 
          ({ ...notification, unread: false })
        );
        localStorage.setItem('voting_notifications', JSON.stringify(updatedNotifications));
      } catch (storageError) {
        console.error('Failed to update localStorage for mark all as read:', storageError);
      }
      
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }

  // Start monitoring for new votes
  startVoteMonitoring(apiClient) {
    if (this.voteCheckInterval) {
      clearInterval(this.voteCheckInterval);
    }

    this.voteCheckInterval = setInterval(async () => {
      try {
        const votes = await apiClient.findObjects('votes', {});
        const currentVoteCount = votes.length;

        if (currentVoteCount > this.voteCount) {
          const newVotesCount = currentVoteCount - this.voteCount;
          this.voteCount = currentVoteCount;

          this.addNotification({
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
  startVotingStatusMonitoring(apiClient) {
    if (this.deadlineCheckInterval) {
      clearInterval(this.deadlineCheckInterval);
    }

    this.deadlineCheckInterval = setInterval(async () => {
      try {
        const votingStatus = await apiClient.findObjects('voting_status', {});
        const currentStatus = votingStatus[0];

        if (currentStatus) {
          // Check if voting status changed
          if (this.votingStatus && this.votingStatus.isActive !== currentStatus.isActive) {
            if (currentStatus.isActive) {
              this.addNotification({
                title: "Voting Started",
                message: "Voting is now active and accepting votes",
                type: "voting",
                action: "view_dashboard",
                priority: "high"
              });
            } else {
              this.addNotification({
                title: "Voting Ended",
                message: "Voting has been stopped and is no longer accepting votes",
                type: "voting",
                action: "view_dashboard",
                priority: "high"
              });
            }
          }

          // Check deadline notifications
          if (currentStatus.autoStopDate) {
            const deadline = new Date(currentStatus.autoStopDate);
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
  }

  // Initialize monitoring
  async initialize(apiClient) {
    try {
      // Get initial vote count
      const votes = await apiClient.findObjects('votes', {});
      this.voteCount = votes.length;

      // Get initial voting status
      const votingStatus = await apiClient.findObjects('voting_status', {});
      this.votingStatus = votingStatus[0];

      // Start monitoring
      this.startVoteMonitoring(apiClient);
      this.startVotingStatusMonitoring(apiClient);

      console.log('Notification service initialized');
    } catch (error) {
      console.error('Error initializing notification service:', error);
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
