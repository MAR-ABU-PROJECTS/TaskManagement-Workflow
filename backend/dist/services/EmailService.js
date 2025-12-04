"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const resend_1 = require("resend");
class EmailService {
    constructor() {
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
            console.warn("⚠️  WARNING: RESEND_API_KEY not set. Email notifications will be disabled.");
            this.resend = null;
            this.isConfigured = false;
        }
        else {
            this.resend = new resend_1.Resend(apiKey);
            this.isConfigured = true;
        }
    }
    async sendEmail(options) {
        try {
            if (!this.isConfigured || !this.resend) {
                console.log(`[EMAIL NOT SENT - NOT CONFIGURED] To: ${options.to}, Subject: ${options.subject}`);
                return;
            }
            const from = process.env.EMAIL_FROM || "no-reply@marprojects.com";
            await this.resend.emails.send({
                from,
                to: options.to,
                subject: options.subject,
                html: options.html,
                text: options.text,
            });
            console.log(`Email sent to ${options.to}: ${options.subject}`);
        }
        catch (error) {
            console.error("Error sending email:", error);
        }
    }
    async sendWelcomeEmail(to, data) {
        const subject = "Welcome to Task Management System!";
        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #0052CC; color: white; padding: 30px; text-align: center; }
          .content { background-color: #f4f5f7; padding: 30px; margin: 20px 0; }
          .welcome-box { background-color: white; padding: 20px; margin: 15px 0; border-radius: 8px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #0052CC; color: white; text-decoration: none; border-radius: 4px; margin-top: 15px; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; padding: 20px; }
          .feature-list { list-style: none; padding: 0; }
          .feature-list li { padding: 8px 0; padding-left: 25px; position: relative; }
          .feature-list li:before { content: "✓"; position: absolute; left: 0; color: #36B37E; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to Task Management System!</h1>
          </div>
          <div class="content">
            <div class="welcome-box">
              <h2>Hi ${data.userName},</h2>
              <p>Welcome aboard! We're excited to have you as part of our team.</p>
              <p>Your account has been successfully created with the following details:</p>
              <ul style="list-style: none; padding: 0; margin: 15px 0;">
                <li><strong>Email:</strong> ${data.userEmail}</li>
                <li><strong>Role:</strong> ${data.role}</li>
              </ul>
            </div>
            
            <div class="welcome-box">
              <h3>What you can do:</h3>
              <ul class="feature-list">
                <li>Create and manage tasks</li>
                <li>Collaborate with your team</li>
                <li>Track project progress</li>
                <li>Receive real-time notifications</li>
                <li>Access detailed reports and analytics</li>
              </ul>
            </div>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/login" class="button">Get Started</a>
            </div>
          </div>
          <div class="footer">
            <p>If you have any questions, feel free to reach out to our support team.</p>
            <p>This is an automated email from Task Management System.</p>
          </div>
        </div>
      </body>
      </html>
    `;
        await this.sendEmail({ to, subject, html });
    }
    async sendLoginNotification(to, data) {
        const subject = "New Login to Your Account";
        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #00875A; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f4f5f7; padding: 20px; margin: 20px 0; }
          .login-details { background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid #00875A; }
          .alert-box { background-color: #FFF3CD; border: 1px solid #FFE69C; padding: 15px; border-radius: 4px; margin-top: 15px; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🔐 Login Notification</h2>
          </div>
          <div class="content">
            <p>Hi ${data.userName},</p>
            <p>We detected a new login to your account. Here are the details:</p>
            
            <div class="login-details">
              <p><strong>Time:</strong> ${data.loginTime}</p>
              ${data.ipAddress
            ? `<p><strong>IP Address:</strong> ${data.ipAddress}</p>`
            : ""}
              ${data.userAgent
            ? `<p><strong>Device:</strong> ${data.userAgent}</p>`
            : ""}
            </div>
            
            <div class="alert-box">
              <p><strong>⚠️ Didn't recognize this activity?</strong></p>
              <p>If this wasn't you, please secure your account immediately by changing your password.</p>
            </div>
          </div>
          <div class="footer">
            <p>This is an automated security notification from Task Management System.</p>
          </div>
        </div>
      </body>
      </html>
    `;
        await this.sendEmail({ to, subject, html });
    }
    async sendTaskAssignmentEmail(to, data) {
        const subject = `Task Assigned: ${data.taskTitle}`;
        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #0052CC; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f4f5f7; padding: 20px; margin: 20px 0; }
          .task-details { background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid #0052CC; }
          .button { display: inline-block; padding: 10px 20px; background-color: #0052CC; color: white; text-decoration: none; border-radius: 4px; margin-top: 15px; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Task Assigned</h2>
          </div>
          <div class="content">
            <p>Hi ${data.assigneeName},</p>
            <p>You have been assigned a new task by ${data.assignedBy}.</p>
            
            <div class="task-details">
              <h3>${data.taskTitle}</h3>
              <p><strong>Project:</strong> ${data.projectName}</p>
              <p><strong>Priority:</strong> <span style="color: ${this.getPriorityColor(data.priority)}">${data.priority}</span></p>
              ${data.dueDate
            ? `<p><strong>Due Date:</strong> ${new Date(data.dueDate).toLocaleDateString()}</p>`
            : ""}
            </div>
            
            <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/tasks/${data.taskId}" class="button">View Task</a>
          </div>
          <div class="footer">
            <p>This is an automated email from Task Management System. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;
        await this.sendEmail({ to, subject, html });
    }
    async sendStatusChangeEmail(to, data) {
        const subject = `Task Status Updated: ${data.taskTitle}`;
        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #0052CC; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f4f5f7; padding: 20px; margin: 20px 0; }
          .status-change { background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid #36B37E; }
          .status { display: inline-block; padding: 5px 10px; border-radius: 3px; font-weight: bold; }
          .button { display: inline-block; padding: 10px 20px; background-color: #0052CC; color: white; text-decoration: none; border-radius: 4px; margin-top: 15px; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Task Status Updated</h2>
          </div>
          <div class="content">
            <p>Hi ${data.userName},</p>
            <p>The status of a task you're involved with has been updated by ${data.changedBy}.</p>
            
            <div class="status-change">
              <h3>${data.taskTitle}</h3>
              <p>
                <span class="status" style="background-color: #DFE1E6">${data.oldStatus}</span>
                →
                <span class="status" style="background-color: #E3FCEF; color: #006644">${data.newStatus}</span>
              </p>
            </div>
            
            <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/tasks/${data.taskId}" class="button">View Task</a>
          </div>
          <div class="footer">
            <p>This is an automated email from Task Management System. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;
        await this.sendEmail({ to, subject, html });
    }
    async sendCommentNotificationEmail(to, data) {
        const subject = `New Comment on: ${data.taskTitle}`;
        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #0052CC; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f4f5f7; padding: 20px; margin: 20px 0; }
          .comment { background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid #0052CC; border-radius: 4px; }
          .comment-header { font-weight: bold; color: #0052CC; margin-bottom: 10px; }
          .button { display: inline-block; padding: 10px 20px; background-color: #0052CC; color: white; text-decoration: none; border-radius: 4px; margin-top: 15px; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>💬 New Comment</h2>
          </div>
          <div class="content">
            <p>Hi ${data.recipientName},</p>
            <p>${data.commenterName} commented on <strong>${data.taskTitle}</strong>${data.projectName ? ` in project <strong>${data.projectName}</strong>` : ""}.</p>
            
            <div class="comment">
              <div class="comment-header">${data.commenterName} wrote:</div>
              <p>${data.commentText}</p>
            </div>
            
            <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/tasks/${data.taskId}" class="button">View Task & Reply</a>
          </div>
          <div class="footer">
            <p>This is an automated email from Task Management System. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;
        await this.sendEmail({ to, subject, html });
    }
    async sendMentionEmail(to, data) {
        const subject = `You were mentioned in: ${data.taskTitle}`;
        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #0052CC; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f4f5f7; padding: 20px; margin: 20px 0; }
          .comment { background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid #FF991F; }
          .button { display: inline-block; padding: 10px 20px; background-color: #0052CC; color: white; text-decoration: none; border-radius: 4px; margin-top: 15px; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>You Were Mentioned</h2>
          </div>
          <div class="content">
            <p>Hi ${data.mentionedUserName},</p>
            <p>${data.commenterName} mentioned you in a comment on <strong>${data.taskTitle}</strong>.</p>
            
            <div class="comment">
              <p><strong>${data.commenterName} commented:</strong></p>
              <p>${data.commentText}</p>
            </div>
            
            <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/tasks/${data.taskId}" class="button">View Task & Comment</a>
          </div>
          <div class="footer">
            <p>This is an automated email from Task Management System. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;
        await this.sendEmail({ to, subject, html });
    }
    async sendSprintStartedEmail(to, data) {
        const subject = `Sprint Started: ${data.sprintName}`;
        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #00875A; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f4f5f7; padding: 20px; margin: 20px 0; }
          .sprint-details { background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid #00875A; }
          .button { display: inline-block; padding: 10px 20px; background-color: #00875A; color: white; text-decoration: none; border-radius: 4px; margin-top: 15px; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🚀 Sprint Started</h2>
          </div>
          <div class="content">
            <p>Hi Team,</p>
            <p>A new sprint has been started!</p>
            
            <div class="sprint-details">
              <h3>${data.sprintName}</h3>
              ${data.sprintGoal
            ? `<p><strong>Goal:</strong> ${data.sprintGoal}</p>`
            : ""}
              <p><strong>Duration:</strong> ${new Date(data.startDate).toLocaleDateString()} - ${new Date(data.endDate).toLocaleDateString()}</p>
              <p><strong>Tasks:</strong> ${data.taskCount} tasks in this sprint</p>
            </div>
            
            <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/sprints" class="button">View Sprint Board</a>
          </div>
          <div class="footer">
            <p>This is an automated email from Task Management System. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;
        for (const email of to) {
            await this.sendEmail({ to: email, subject, html });
        }
    }
    async sendSprintCompletedEmail(to, data) {
        const subject = `Sprint Completed: ${data.sprintName}`;
        const completionRate = Math.round((data.completedTasks / data.totalTasks) * 100);
        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #0052CC; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f4f5f7; padding: 20px; margin: 20px 0; }
          .sprint-summary { background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid #0052CC; }
          .progress-bar { width: 100%; height: 25px; background-color: #DFE1E6; border-radius: 4px; overflow: hidden; }
          .progress-fill { height: 100%; background-color: #36B37E; text-align: center; color: white; line-height: 25px; }
          .button { display: inline-block; padding: 10px 20px; background-color: #0052CC; color: white; text-decoration: none; border-radius: 4px; margin-top: 15px; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>✅ Sprint Completed</h2>
          </div>
          <div class="content">
            <p>Hi Team,</p>
            <p>Great work! The sprint has been completed.</p>
            
            <div class="sprint-summary">
              <h3>${data.sprintName}</h3>
              <p><strong>Completion Rate:</strong></p>
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${completionRate}%">${completionRate}%</div>
              </div>
              <p style="margin-top: 10px;">
                <strong>${data.completedTasks}</strong> of <strong>${data.totalTasks}</strong> tasks completed
              </p>
            </div>
            
            <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/sprints" class="button">View Sprint Report</a>
          </div>
          <div class="footer">
            <p>This is an automated email from Task Management System. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;
        for (const email of to) {
            await this.sendEmail({ to: email, subject, html });
        }
    }
    async sendPromotionEmail(to, data) {
        const subject = `🎉 Congratulations! You've Been Promoted`;
        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #00875A; color: white; padding: 30px; text-align: center; }
          .content { background-color: #f4f5f7; padding: 30px; margin: 20px 0; }
          .promotion-box { background-color: white; padding: 25px; margin: 15px 0; border-left: 4px solid #00875A; border-radius: 4px; }
          .role-change { text-align: center; padding: 20px; margin: 15px 0; }
          .role { display: inline-block; padding: 10px 20px; border-radius: 4px; font-weight: bold; font-size: 18px; }
          .old-role { background-color: #DFE1E6; color: #42526E; }
          .new-role { background-color: #E3FCEF; color: #006644; }
          .arrow { color: #00875A; font-size: 24px; margin: 0 15px; }
          .congrats-icon { font-size: 48px; text-align: center; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 24px; background-color: #00875A; color: white; text-decoration: none; border-radius: 4px; margin-top: 15px; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; padding: 20px; }
          .responsibilities { background-color: #E3FCEF; padding: 15px; border-radius: 4px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="congrats-icon">🎉</div>
            <h1>Congratulations on Your Promotion!</h1>
          </div>
          <div class="content">
            <div class="promotion-box">
              <h2>Hi ${data.userName},</h2>
              <p>We're thrilled to announce that you have been promoted!</p>
              
              <div class="role-change">
                <span class="role old-role">${data.oldRole}</span>
                <span class="arrow">→</span>
                <span class="role new-role">${data.newRole}</span>
              </div>
              
              <p>This promotion was approved by <strong>${data.promotedBy}</strong> in recognition of your hard work, dedication, and outstanding contributions to the team.</p>
            </div>
            
            <div class="responsibilities">
              <h3 style="color: #006644; margin-top: 0;">Your New Role & Responsibilities</h3>
              <p>With this new role, you'll have expanded permissions and responsibilities within the organization. Please review your updated access rights and team management capabilities.</p>
            </div>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard" class="button">Access Dashboard</a>
            </div>
            
            <p style="margin-top: 25px; text-align: center; color: #666;">
              <em>Keep up the great work! We're excited to see your continued growth with the team.</em>
            </p>
          </div>
          <div class="footer">
            <p>This is an automated notification from Task Management System.</p>
            <p>If you have any questions about your new role, please contact your manager.</p>
          </div>
        </div>
      </body>
      </html>
    `;
        await this.sendEmail({ to, subject, html });
    }
    async sendDemotionEmail(to, data) {
        const subject = `Role Change Notification`;
        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #0052CC; color: white; padding: 30px; text-align: center; }
          .content { background-color: #f4f5f7; padding: 30px; margin: 20px 0; }
          .change-box { background-color: white; padding: 25px; margin: 15px 0; border-left: 4px solid #0052CC; border-radius: 4px; }
          .role-change { text-align: center; padding: 20px; margin: 15px 0; }
          .role { display: inline-block; padding: 10px 20px; border-radius: 4px; font-weight: bold; font-size: 18px; }
          .old-role { background-color: #DFE1E6; color: #42526E; }
          .new-role { background-color: #DEEBFF; color: #0747A6; }
          .arrow { color: #0052CC; font-size: 24px; margin: 0 15px; }
          .info-box { background-color: #FFF3CD; border: 1px solid #FFE69C; padding: 15px; border-radius: 4px; margin: 15px 0; }
          .button { display: inline-block; padding: 12px 24px; background-color: #0052CC; color: white; text-decoration: none; border-radius: 4px; margin-top: 15px; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; padding: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Role Change Notification</h1>
          </div>
          <div class="content">
            <div class="change-box">
              <h2>Hi ${data.userName},</h2>
              <p>We want to inform you that your role within the organization has been updated.</p>
              
              <div class="role-change">
                <span class="role old-role">${data.oldRole}</span>
                <span class="arrow">→</span>
                <span class="role new-role">${data.newRole}</span>
              </div>
              
              <p>This change was made by <strong>${data.demotedBy}</strong>.</p>
              ${data.reason
            ? `<p><strong>Reason:</strong> ${data.reason}</p>`
            : ""}
            </div>
            
            <div class="info-box">
              <h3 style="margin-top: 0;">📋 What This Means</h3>
              <p>Your permissions and access rights have been updated to reflect your new role. Please review your current capabilities in the system.</p>
              <p>If you have any questions or concerns about this change, please don't hesitate to reach out to your manager or HR department.</p>
            </div>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard" class="button">View Dashboard</a>
            </div>
          </div>
          <div class="footer">
            <p>This is an automated notification from Task Management System.</p>
            <p>For questions or concerns, please contact your manager or HR department.</p>
          </div>
        </div>
      </body>
      </html>
    `;
        await this.sendEmail({ to, subject, html });
    }
    getPriorityColor(priority) {
        const colors = {
            LOW: "#0052CC",
            MEDIUM: "#FF991F",
            HIGH: "#FF5630",
            CRITICAL: "#DE350B",
        };
        return colors[priority] || "#0052CC";
    }
}
exports.EmailService = EmailService;
exports.default = new EmailService();
