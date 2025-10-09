import { 
  Notification, 
  NotificationType 
} from '@prisma/client';
import { IUser } from './user.types';

// Core Notification Types
export interface INotification extends Notification {
  user?: IUser;
}

export interface CreateNotificationRequest {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
}

export interface UpdateNotificationRequest {
  isRead?: boolean;
}

export interface BulkMarkReadRequest {
  notificationIds: string[];
}

// Notification Preferences
export interface NotificationPreferences {
  userId: string;
  emailNotifications: {
    taskAssigned: boolean;
    taskUpdated: boolean;
    taskCommented: boolean;
    deadlineApproaching: boolean;
    sprintStarted: boolean;
    sprintCompleted: boolean;
    projectUpdated: boolean;
    mentions: boolean;
  };
  inAppNotifications: {
    taskAssigned: boolean;
    taskUpdated: boolean;
    taskCommented: boolean;
    deadlineApproaching: boolean;
    sprintStarted: boolean;
    sprintCompleted: boolean;
    projectUpdated: boolean;
    mentions: boolean;
  };
  pushNotifications: {
    taskAssigned: boolean;
    taskUpdated: boolean;
    taskCommented: boolean;
    deadlineApproaching: boolean;
    urgentIssues: boolean;
  };
  digestFrequency: 'immediate' | 'hourly' | 'daily' | 'weekly' | 'never';
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:mm format
    endTime: string;   // HH:mm format
    timezone: string;
  };
}

export interface UpdateNotificationPreferencesRequest {
  emailNotifications?: Partial<NotificationPreferences['emailNotifications']>;
  inAppNotifications?: Partial<NotificationPreferences['inAppNotifications']>;
  pushNotifications?: Partial<NotificationPreferences['pushNotifications']>;
  digestFrequency?: NotificationPreferences['digestFrequency'];
  quietHours?: Partial<NotificationPreferences['quietHours']>;
}

// Notification Templates
export interface NotificationTemplate {
  type: NotificationType;
  title: string;
  message: string;
  emailTemplate?: string;
  variables: string[];
}

// Notification Events
export interface NotificationEvent {
  type: NotificationType;
  recipientIds: string[];
  data: {
    title: string;
    message: string;
    actionUrl?: string;
    metadata?: any;
  };
  channels: ('email' | 'in_app' | 'push')[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  scheduledFor?: Date;
}

// Email Notification Types
export interface EmailNotificationData {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  attachments?: EmailAttachment[];
  templateId?: string;
  templateData?: Record<string, any>;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType: string;
  disposition?: 'attachment' | 'inline';
  cid?: string;
}

// Push Notification Types
export interface PushNotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: number;
  sound?: string;
  data?: Record<string, any>;
  actions?: PushNotificationAction[];
  requireInteraction?: boolean;
  silent?: boolean;
  tag?: string;
  timestamp?: number;
}

export interface PushNotificationAction {
  action: string;
  title: string;
  icon?: string;
}

// Notification Delivery Status
export interface NotificationDeliveryStatus {
  notificationId: string;
  channel: 'email' | 'in_app' | 'push';
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';
  sentAt?: Date;
  deliveredAt?: Date;
  failureReason?: string;
  retryCount: number;
  nextRetryAt?: Date;
}

// Notification Query Types
export interface NotificationFilters {
  type?: NotificationType;
  isRead?: boolean;
  createdFrom?: Date;
  createdTo?: Date;
}

export interface NotificationListQuery extends NotificationFilters {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'type';
  sortOrder?: 'asc' | 'desc';
}

// Notification Statistics
export interface NotificationStats {
  totalNotifications: number;
  unreadNotifications: number;
  notificationsByType: Record<NotificationType, number>;
  deliveryStats: {
    email: {
      sent: number;
      delivered: number;
      failed: number;
      bounced: number;
    };
    push: {
      sent: number;
      delivered: number;
      failed: number;
    };
    inApp: {
      sent: number;
      read: number;
      unread: number;
    };
  };
}

// Notification Digest Types
export interface NotificationDigest {
  userId: string;
  frequency: 'hourly' | 'daily' | 'weekly';
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    totalNotifications: number;
    taskAssignments: number;
    taskUpdates: number;
    comments: number;
    deadlines: number;
    sprintUpdates: number;
    projectUpdates: number;
  };
  notifications: INotification[];
  highlights: string[];
}

// Real-time Notification Types
export interface RealTimeNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  timestamp: Date;
  actionUrl?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

export interface NotificationSubscription {
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
  createdAt: Date;
  lastUsed?: Date;
}

// Escalation Rules
export interface EscalationRule {
  id: string;
  name: string;
  projectId?: string;
  conditions: EscalationCondition[];
  actions: EscalationAction[];
  isActive: boolean;
  priority: number;
}

export interface EscalationCondition {
  type: 'task_overdue' | 'task_blocked' | 'sprint_at_risk' | 'custom';
  parameters: Record<string, any>;
  threshold?: number;
  timeUnit?: 'minutes' | 'hours' | 'days';
}

export interface EscalationAction {
  type: 'notify_user' | 'notify_manager' | 'create_task' | 'send_email' | 'webhook';
  parameters: Record<string, any>;
  delay?: number;
  delayUnit?: 'minutes' | 'hours' | 'days';
}

// Export enums for convenience
export { NotificationType } from '@prisma/client';