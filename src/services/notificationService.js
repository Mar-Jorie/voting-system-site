// Notification Service for managing real-time notifications
import { toast } from 'react-hot-toast';

class NotificationService {
  constructor() {
    this.notifications = [];
    this.listeners = [];
    this.voteCount = 0;
    this.votingStatus = null;
    this.deadlineCheckInterval = null;
    this.voteCheckInterval = null;
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

  // Add a new notification
  addNotification(notification) {
    const newNotification = {
      id: Date.now() + Math.random(),
      timestamp: new Date(),
      unread: true,
      ...notification
    };

    this.notifications.unshift(newNotification);
    
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
