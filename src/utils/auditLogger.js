// Audit Logger Utility
import apiClient from '../usecases/api.js';

class AuditLogger {
  constructor() {
    this.isEnabled = true;
  }

  // Get current user info from localStorage
  getCurrentUser() {
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }

  // Get client information
  getClientInfo() {
    return {
      ip_address: 'unknown', // Would need server-side implementation for real IP
      user_agent: navigator.userAgent
    };
  }

  // Main logging method
  async log({
    action,
    entity_type,
    entity_id = null,
    entity_name = null,
    details = {},
    severity = 'info',
    category
  }) {
    if (!this.isEnabled) return;

    try {
      const user = this.getCurrentUser();
      const clientInfo = this.getClientInfo();

      const auditData = {
        action,
        entity_type,
        entity_id,
        entity_name,
        user_id: user?.id || null,
        user_email: user?.email || null,
        user_name: user ? `${user.firstName} ${user.lastName}` : null,
        details,
        severity,
        category,
        ...clientInfo
      };

      await apiClient.createObject('audit_logs', auditData);
    } catch (error) {
      console.error('Failed to log audit event:', error);
      // Don't throw error to avoid breaking the main functionality
    }
  }

  // Convenience methods for common actions
  async logUserAction(action, entity_type, entity_id, entity_name, details = {}) {
    return this.log({
      action,
      entity_type,
      entity_id,
      entity_name,
      details,
      category: 'user_management'
    });
  }

  async logDataAction(action, entity_type, entity_id, entity_name, details = {}) {
    return this.log({
      action,
      entity_type,
      entity_id,
      entity_name,
      details,
      category: 'data_management'
    });
  }

  async logVotingAction(action, details = {}) {
    return this.log({
      action,
      entity_type: 'system',
      details,
      category: 'voting'
    });
  }

  async logAuthenticationAction(action, details = {}) {
    return this.log({
      action,
      entity_type: 'user',
      details,
      category: 'authentication'
    });
  }

  async logSystemAction(action, details = {}) {
    return this.log({
      action,
      entity_type: 'system',
      details,
      category: 'system'
    });
  }

  async logExportImportAction(action, details = {}) {
    return this.log({
      action,
      entity_type: 'system',
      details,
      category: 'export_import'
    });
  }

  // Specific action methods
  async logLogin(userEmail) {
    return this.logAuthenticationAction('login', { user_email: userEmail });
  }

  async logLogout(userEmail) {
    return this.logAuthenticationAction('logout', { user_email: userEmail });
  }

  async logCreate(entity_type, entity_id, entity_name, details = {}) {
    return this.logDataAction('create', entity_type, entity_id, entity_name, details);
  }

  async logUpdate(entity_type, entity_id, entity_name, details = {}) {
    return this.logDataAction('update', entity_type, entity_id, entity_name, details);
  }

  async logDelete(entity_type, entity_id, entity_name, details = {}) {
    return this.logDataAction('delete', entity_type, entity_id, entity_name, details);
  }

  async logVoteCast(candidateId, candidateName, category, voterEmail) {
    return this.logVotingAction('vote_cast', {
      candidate_id: candidateId,
      candidate_name: candidateName,
      category,
      voter_email: voterEmail
    });
  }

  async logVotingStarted() {
    return this.logVotingAction('voting_started');
  }

  async logVotingStopped() {
    return this.logVotingAction('voting_stopped');
  }

  async logResultsShown() {
    return this.logVotingAction('results_shown');
  }

  async logResultsHidden() {
    return this.logVotingAction('results_hidden');
  }

  async logAutoStopSet(stopDateTime) {
    return this.logVotingAction('auto_stop_set', {
      stop_date_time: stopDateTime.toISOString()
    });
  }

  async logExportData(format, recordCount) {
    return this.logExportImportAction('export_data', {
      format,
      record_count: recordCount
    });
  }

  async logImportData(format, recordCount) {
    return this.logExportImportAction('import_data', {
      format,
      record_count: recordCount
    });
  }

  // Disable logging (useful for testing or bulk operations)
  disable() {
    this.isEnabled = false;
  }

  // Enable logging
  enable() {
    this.isEnabled = true;
  }
}

// Create singleton instance
const auditLogger = new AuditLogger();

export default auditLogger;
