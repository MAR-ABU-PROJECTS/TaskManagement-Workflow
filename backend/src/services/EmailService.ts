import { Resend } from "resend";

// M.A.R Abu Projects Constants
const APP_CONSTANTS = {
  COMPANY: {
    NAME: "MAR ABU PROJECTS SERVICES LLC",
    PRIMARY_COLOR: "#F6931B",
    SECONDARY_COLOR: "#000000",
    EMAIL: "noreply@marabuprojects.com",
    SUPPORT_EMAIL: "support@marabuprojects.com",
    ADDRESS: "Lagos, Nigeria",
  },
  COLORS: {
    PRIMARY: "#F6931B",
    SECONDARY: "#000000",
    SUCCESS: "#36B37E",
    WARNING: "#FF991F",
    DANGER: "#FF5630",
  },
};

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface TaskAssignmentEmailData {
  assigneeName: string;
  taskTitle: string;
  taskId: string;
  projectName: string;
  assignedBy: string;
  priority: string;
  dueDate?: string;
}

interface StatusChangeEmailData {
  userName: string;
  taskTitle: string;
  taskId: string;
  oldStatus: string;
  newStatus: string;
  changedBy: string;
}

interface CommentMentionEmailData {
  mentionedUserName: string;
  commenterName: string;
  taskTitle: string;
  taskId: string;
  commentText: string;
}

interface SprintEmailData {
  teamMembers: string[];
  sprintName: string;
  sprintGoal?: string;
  startDate: string;
  endDate: string;
  taskCount: number;
}

interface WelcomeEmailData {
  userName: string;
  userEmail: string;
  role: string;
}

interface LoginNotificationData {
  userName: string;
  loginTime: string;
  ipAddress?: string;
  userAgent?: string;
}

interface PromotionEmailData {
  userName: string;
  oldRole: string;
  newRole: string;
  promotedBy: string;
}

interface DemotionEmailData {
  userName: string;
  oldRole: string;
  newRole: string;
  demotedBy: string;
  reason?: string;
}

interface PasswordResetEmailData {
  userName: string;
  resetUrl: string;
}

interface PasswordChangedEmailData {
  userName: string;
}

export class EmailService {
  private resend: Resend | null;
  private isConfigured: boolean;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      console.warn(
        "⚠️  WARNING: RESEND_API_KEY not set. Email notifications will be disabled.",
      );
      this.resend = null;
      this.isConfigured = false;
    } else {
      this.resend = new Resend(apiKey);
      this.isConfigured = true;
    }
  }

  /**
   * Base email template with M.A.R Abu Projects branding
   */
  private getBaseTemplate(content: string): string {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${APP_CONSTANTS.COMPANY.NAME}</title>
<style>
body{font-family:Arial,sans-serif;line-height:1.6;color:#333;background:#f4f4f4;margin:0;padding:0;}
.container{max-width:600px;margin:20px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 4px rgba(0,0,0,.1);}
.header{background:${APP_CONSTANTS.COLORS.PRIMARY};color:#fff;padding:20px;text-align:center;}
.content{padding:30px;}
.button{display:inline-block;padding:12px 30px;background:${APP_CONSTANTS.COLORS.PRIMARY};color:#fff;text-decoration:none;border-radius:5px;margin:20px 0;}
.footer{background:${APP_CONSTANTS.COLORS.SECONDARY};color:#fff;padding:20px;text-align:center;font-size:14px;}
.info-box{background:#f9f9f9;border-left:4px solid ${APP_CONSTANTS.COLORS.PRIMARY};padding:15px;margin:20px 0;}
.detail-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;}
.detail-label{font-weight:bold;color:#666;}
.success-box{background:#E3FCEF;border-left:4px solid ${APP_CONSTANTS.COLORS.SUCCESS};padding:15px;margin:20px 0;}
.warning-box{background:#FFF4E5;border-left:4px solid ${APP_CONSTANTS.COLORS.WARNING};padding:15px;margin:20px 0;}
.feature-list{list-style:none;padding:0;}
.feature-list li{padding:8px 0;padding-left:25px;position:relative;}
.feature-list li:before{content:"✓";position:absolute;left:0;color:${APP_CONSTANTS.COLORS.SUCCESS};font-weight:bold;}
a{color:${APP_CONSTANTS.COLORS.PRIMARY};}
</style></head><body>
<div class="container">
<div class="header"><h1>Task Management System</h1><p style="margin:0;opacity:0.9;">${APP_CONSTANTS.COMPANY.NAME}</p></div>
<div class="content">${content}</div>
<div class="footer">
<p>&copy; ${new Date().getFullYear()} ${APP_CONSTANTS.COMPANY.NAME}. All rights reserved.</p>
<p><a href="mailto:${APP_CONSTANTS.COMPANY.SUPPORT_EMAIL}" style="color:#fff;">${APP_CONSTANTS.COMPANY.SUPPORT_EMAIL}</a></p>
</div></div></body></html>`;
  }

  /**
   * Send email using Resend
   */
  private async sendEmail(options: EmailOptions): Promise<void> {
    try {
      if (!this.isConfigured || !this.resend) {
        console.log(
          `[EMAIL NOT SENT - NOT CONFIGURED] To: ${options.to}, Subject: ${options.subject}`,
        );
        return;
      }

      const from = process.env.EMAIL_FROM || APP_CONSTANTS.COMPANY.EMAIL;

      await this.resend.emails.send({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      console.log(`Email sent to ${options.to}: ${options.subject}`);
    } catch (error) {
      console.error("Error sending email:", error);
    }
  }

  /**
   * Send welcome email to new users
   */
  async sendWelcomeEmail(to: string, data: WelcomeEmailData): Promise<void> {
    const subject = "Welcome to Task Management System!";
    const content = `
      <h2>🎉 Welcome, ${data.userName}!</h2>
      <p>We're excited to have you as part of our team.</p>
      
      <div class="info-box">
        <h3 style="margin-top:0;">Your Account Details</h3>
        <div class="detail-row">
          <span class="detail-label">Email:</span>
          <span>${data.userEmail}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Role:</span>
          <span>${data.role}</span>
        </div>
      </div>
      
      <h3>What you can do:</h3>
      <ul class="feature-list">
        <li>Create and manage tasks</li>
        <li>Collaborate with your team</li>
        <li>Track project progress</li>
        <li>Receive real-time notifications</li>
        <li>Access detailed reports and analytics</li>
      </ul>
      
      <div style="text-align: center;">
        <a href="${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/login" class="button">Get Started</a>
      </div>
    `;

    const html = this.getBaseTemplate(content);
    await this.sendEmail({ to, subject, html });
  }

  /**
   * Send login notification email
   */
  async sendLoginNotification(
    to: string,
    data: LoginNotificationData,
  ): Promise<void> {
    const subject = "New Login to Your Account";
    const content = `
      <h2>🔐 Login Notification</h2>
      <p>Hi ${data.userName},</p>
      <p>We detected a new login to your account. Here are the details:</p>
      
      <div class="info-box">
        <div class="detail-row">
          <span class="detail-label">Time:</span>
          <span>${data.loginTime}</span>
        </div>
        ${
          data.ipAddress
            ? `<div class="detail-row">
                <span class="detail-label">IP Address:</span>
                <span>${data.ipAddress}</span>
              </div>`
            : ""
        }
        ${
          data.userAgent
            ? `<div class="detail-row">
                <span class="detail-label">Device:</span>
                <span>${data.userAgent}</span>
              </div>`
            : ""
        }
      </div>
      
      <div class="warning-box">
        <p><strong>⚠️ Didn't recognize this activity?</strong></p>
        <p>If this wasn't you, please secure your account immediately by changing your password.</p>
      </div>
    `;

    const html = this.getBaseTemplate(content);
    await this.sendEmail({ to, subject, html });
  }

  /**
   * Send task assignment email
   */
  async sendTaskAssignmentEmail(
    to: string,
    data: TaskAssignmentEmailData,
  ): Promise<void> {
    const subject = `Task Assigned: ${data.taskTitle}`;
    const content = `
      <h2>📋 Task Assigned</h2>
      <p>Hi ${data.assigneeName},</p>
      <p>You have been assigned a new task by <strong>${data.assignedBy}</strong>.</p>
      
      <div class="info-box">
        <h3 style="margin-top:0;">${data.taskTitle}</h3>
        <div class="detail-row">
          <span class="detail-label">Project:</span>
          <span>${data.projectName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Priority:</span>
          <span style="color: ${this.getPriorityColor(data.priority)};font-weight:bold;">${data.priority}</span>
        </div>
        ${
          data.dueDate
            ? `<div class="detail-row">
                <span class="detail-label">Due Date:</span>
                <span>${new Date(data.dueDate).toLocaleDateString()}</span>
              </div>`
            : ""
        }
      </div>
      
      <div style="text-align: center;">
        <a href="${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/tasks/${data.taskId}" class="button">View Task</a>
      </div>
    `;

    const html = this.getBaseTemplate(content);
    await this.sendEmail({ to, subject, html });
  }

  /**
   * Send status change notification email
   */
  async sendStatusChangeEmail(
    to: string,
    data: StatusChangeEmailData,
  ): Promise<void> {
    const subject = `Task Status Updated: ${data.taskTitle}`;
    const content = `
      <h2>🔄 Task Status Updated</h2>
      <p>Hi ${data.userName},</p>
      <p>The status of a task you're involved with has been updated by <strong>${data.changedBy}</strong>.</p>
      
      <div class="success-box">
        <h3 style="margin-top:0;">${data.taskTitle}</h3>
        <p style="font-size:18px;">
          <span style="display:inline-block;padding:5px 15px;background:#DFE1E6;border-radius:4px;font-weight:bold;">${data.oldStatus}</span>
          <span style="margin:0 10px;font-size:24px;">→</span>
          <span style="display:inline-block;padding:5px 15px;background:#E3FCEF;color:#006644;border-radius:4px;font-weight:bold;">${data.newStatus}</span>
        </p>
      </div>
      
      <div style="text-align: center;">
        <a href="${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/tasks/${data.taskId}" class="button">View Task</a>
      </div>
    `;

    const html = this.getBaseTemplate(content);
    await this.sendEmail({ to, subject, html });
  }

  /**
   * Send comment notification email (when someone comments on user's task/project)
   */
  async sendCommentNotificationEmail(
    to: string,
    data: {
      recipientName: string;
      commenterName: string;
      taskTitle: string;
      taskId: string;
      commentText: string;
      projectName?: string;
    },
  ): Promise<void> {
    const subject = `New Comment on: ${data.taskTitle}`;
    const content = `
      <h2>💬 New Comment</h2>
      <p>Hi ${data.recipientName},</p>
      <p><strong>${data.commenterName}</strong> commented on <strong>${
        data.taskTitle
      }</strong>${
        data.projectName
          ? ` in project <strong>${data.projectName}</strong>`
          : ""
      }.</p>
      
      <div class="warning-box">
        <p style="margin:0;"><strong>${data.commenterName} wrote:</strong></p>
        <p style="margin:10px 0 0 0;font-style:italic;">${data.commentText}</p>
      </div>
      
      <div style="text-align: center;">
        <a href="${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/tasks/${data.taskId}" class="button">View Task & Reply</a>
      </div>
    `;

    const html = this.getBaseTemplate(content);
    await this.sendEmail({ to, subject, html });
  }

  /**
   * Send mention notification email
   */
  async sendMentionEmail(
    to: string,
    data: CommentMentionEmailData,
  ): Promise<void> {
    const subject = `You were mentioned in: ${data.taskTitle}`;
    const content = `
      <h2>@ You Were Mentioned</h2>
      <p>Hi ${data.mentionedUserName},</p>
      <p><strong>${data.commenterName}</strong> mentioned you in a comment on <strong>${
        data.taskTitle
      }</strong>.</p>
      
      <div class="warning-box">
        <p style="margin:0;"><strong>${data.commenterName} commented:</strong></p>
        <p style="margin:10px 0 0 0;font-style:italic;">${data.commentText}</p>
      </div>
      
      <div style="text-align: center;">
        <a href="${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/tasks/${data.taskId}" class="button">View Task & Comment</a>
      </div>
    `;

    const html = this.getBaseTemplate(content);
    await this.sendEmail({ to, subject, html });
  }

  /**
   * Send sprint started notification
   */
  async sendSprintStartedEmail(
    to: string[],
    data: SprintEmailData,
  ): Promise<void> {
    const subject = `Sprint Started: ${data.sprintName}`;
    const content = `
      <h2>🚀 Sprint Started</h2>
      <p>Hi Team,</p>
      <p>A new sprint has been started!</p>
      
      <div class="success-box">
        <h3 style="margin-top:0;">${data.sprintName}</h3>
        ${
          data.sprintGoal
            ? `<p><strong>Goal:</strong> ${data.sprintGoal}</p>`
            : ""
        }
        <div class="detail-row">
          <span class="detail-label">Duration:</span>
          <span>${new Date(data.startDate).toLocaleDateString()} - ${new Date(
            data.endDate,
          ).toLocaleDateString()}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Tasks:</span>
          <span>${data.taskCount} tasks in this sprint</span>
        </div>
      </div>
      
      <div style="text-align: center;">
        <a href="${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/sprints" class="button">View Sprint Board</a>
      </div>
    `;

    const html = this.getBaseTemplate(content);

    // Send to all team members
    for (const email of to) {
      await this.sendEmail({ to: email, subject, html });
    }
  }

  /**
   * Send sprint completed notification
   */
  async sendSprintCompletedEmail(
    to: string[],
    data: SprintEmailData & { completedTasks: number; totalTasks: number },
  ): Promise<void> {
    const subject = `Sprint Completed: ${data.sprintName}`;
    const completionRate = Math.round(
      (data.completedTasks / data.totalTasks) * 100,
    );

    const content = `
      <h2>✅ Sprint Completed</h2>
      <p>Hi Team,</p>
      <p>Great work! The sprint has been completed.</p>
      
      <div class="success-box">
        <h3 style="margin-top:0;">${data.sprintName}</h3>
        <p><strong>Completion Rate:</strong></p>
        <div style="width:100%;height:25px;background-color:#DFE1E6;border-radius:4px;overflow:hidden;margin:10px 0;">
          <div style="height:100%;background-color:#36B37E;text-align:center;color:white;line-height:25px;width:${completionRate}%;">${completionRate}%</div>
        </div>
        <p style="margin-top:10px;">
          <strong>${data.completedTasks}</strong> of <strong>${
            data.totalTasks
          }</strong> tasks completed
        </p>
      </div>
      
      <div style="text-align: center;">
        <a href="${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/sprints" class="button">View Sprint Report</a>
      </div>
    `;

    const html = this.getBaseTemplate(content);

    for (const email of to) {
      await this.sendEmail({ to: email, subject, html });
    }
  }

  /**
   * Send promotion notification email
   */
  async sendPromotionEmail(
    to: string,
    data: PromotionEmailData,
  ): Promise<void> {
    const subject = `🎉 Congratulations! You've Been Promoted`;
    const content = `
      <div style="text-align:center;font-size:48px;margin:20px 0;">🎉</div>
      <h2 style="text-align:center;">Congratulations on Your Promotion!</h2>
      <p>Hi ${data.userName},</p>
      <p>We're thrilled to announce that you have been promoted!</p>
      
      <div class="success-box">
        <h3 style="margin-top:0;">Role Change</h3>
        <p style="font-size:18px;text-align:center;">
          <span style="display:inline-block;padding:10px 20px;background:#DFE1E6;color:#42526E;border-radius:4px;font-weight:bold;">${data.oldRole}</span>
          <span style="margin:0 15px;color:${APP_CONSTANTS.COLORS.SUCCESS};font-size:24px;">→</span>
          <span style="display:inline-block;padding:10px 20px;background:#E3FCEF;color:#006644;border-radius:4px;font-weight:bold;">${data.newRole}</span>
        </p>
        <p>This promotion was approved by <strong>${
          data.promotedBy
        }</strong> in recognition of your hard work, dedication, and outstanding contributions to the team.</p>
      </div>
      
      <div class="info-box">
        <h3 style="margin-top:0;">Your New Role & Responsibilities</h3>
        <p>With this new role, you'll have expanded permissions and responsibilities within the organization. Please review your updated access rights and team management capabilities.</p>
      </div>
      
      <div style="text-align: center;">
        <a href="${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/dashboard" class="button">Access Dashboard</a>
      </div>
      
      <p style="margin-top:25px;text-align:center;color:#666;">
        <em>Keep up the great work! We're excited to see your continued growth with the team.</em>
      </p>
    `;

    const html = this.getBaseTemplate(content);
    await this.sendEmail({ to, subject, html });
  }

  /**
   * Send demotion notification email
   */
  async sendDemotionEmail(to: string, data: DemotionEmailData): Promise<void> {
    const subject = `Role Change Notification`;
    const content = `
      <h2>📝 Role Change Notification</h2>
      <p>Hi ${data.userName},</p>
      <p>We want to inform you that your role within the organization has been updated.</p>
      
      <div class="info-box">
        <h3 style="margin-top:0;">Role Update</h3>
        <p style="font-size:18px;text-align:center;">
          <span style="display:inline-block;padding:10px 20px;background:#DFE1E6;color:#42526E;border-radius:4px;font-weight:bold;">${data.oldRole}</span>
          <span style="margin:0 15px;color:${APP_CONSTANTS.COLORS.PRIMARY};font-size:24px;">→</span>
          <span style="display:inline-block;padding:10px 20px;background:#DEEBFF;color:#0747A6;border-radius:4px;font-weight:bold;">${data.newRole}</span>
        </p>
        <p>This change was made by <strong>${data.demotedBy}</strong>.</p>
        ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ""}
      </div>
      
      <div class="warning-box">
        <h3 style="margin-top:0;">📋 What This Means</h3>
        <p>Your permissions and access rights have been updated to reflect your new role. Please review your current capabilities in the system.</p>
        <p>If you have any questions or concerns about this change, please don't hesitate to reach out to your manager or HR department.</p>
      </div>
      
      <div style="text-align: center;">
        <a href="${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/dashboard" class="button">View Dashboard</a>
      </div>
    `;

    const html = this.getBaseTemplate(content);
    await this.sendEmail({ to, subject, html });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    to: string,
    data: PasswordResetEmailData,
  ): Promise<void> {
    const subject = "Password Reset Request";
    const content = `
      <h2>🔐 Password Reset Request</h2>
      <p>Hi ${data.userName},</p>
      <p>We received a request to reset your password for your Task Management System account.</p>
      
      <p>Click the button below to reset your password. <strong>This link will expire in 1 hour.</strong></p>
      
      <div style="text-align: center;margin:25px 0;">
        <a href="${data.resetUrl}" class="button">Reset Password</a>
      </div>
      
      <div class="warning-box">
        <p style="margin:0;"><strong>⚠️ Security Notice:</strong></p>
        <p style="margin:10px 0 0 0;">If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
        <p style="margin:10px 0 0 0;">Never share this link with anyone.</p>
      </div>
      
      <p style="color:#666;font-size:12px;margin-top:20px;">
        If the button doesn't work, copy and paste this link into your browser:<br>
        <a href="${data.resetUrl}" style="word-break:break-all;">${data.resetUrl}</a>
      </p>
    `;

    const html = this.getBaseTemplate(content);
    await this.sendEmail({ to, subject, html });
  }

  /**
   * Send password changed confirmation email
   */
  async sendPasswordChangedEmail(
    to: string,
    data: PasswordChangedEmailData,
  ): Promise<void> {
    const subject = "Password Changed Successfully";
    const content = `
      <h2>✅ Password Changed Successfully</h2>
      <p>Hi ${data.userName},</p>
      
      <div class="success-box">
        <p style="margin:0;"><strong>Your password has been changed successfully.</strong></p>
        <p style="margin:10px 0 0 0;">You can now use your new password to log in to your Task Management System account.</p>
      </div>
      
      <div class="warning-box">
        <p style="margin:0;"><strong>⚠️ Security Alert:</strong></p>
        <p style="margin:10px 0 0 0;">If you didn't make this change, please contact your administrator immediately.</p>
      </div>
    `;

    const html = this.getBaseTemplate(content);
    await this.sendEmail({ to, subject, html });
  }

  /**
   * Get color code for priority
   */
  private getPriorityColor(priority: string): string {
    const colors: Record<string, string> = {
      LOW: "#0052CC",
      MEDIUM: "#FF991F",
      HIGH: "#FF5630",
      CRITICAL: "#DE350B",
    };
    return colors[priority] || "#0052CC";
  }
}

export default new EmailService();
