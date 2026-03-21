import nodemailer, { Transporter } from 'nodemailer';
import { logger } from '../utils/logger';
import { FraudAlert, User, Transaction } from '../types';

export class NotificationService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_PORT === '465', // true for port 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  // Method signature matching the controller call
  async sendFraudAlertByTransaction(userEmail: string, transaction: Transaction): Promise<void> {
    try {
      const subject = `Fraud Alert: High Risk Transaction Detected`;
      const html = this.generateFraudAlertEmailByTransaction(transaction);

      await this.transporter.sendMail({
        from: process.env.FROM_EMAIL,
        to: userEmail,
        subject,
        html
      });

      logger.info('Fraud alert email sent', {
        transactionId: transaction.id,
        userEmail: userEmail,
        riskScore: transaction.riskScore
      });
    } catch (error: any) {
      logger.error('Failed to send fraud alert email', {
        error: error.message,
        transactionId: transaction.id,
        userEmail: userEmail
      });
    }
  }

  // Method signature matching the controller call  
  async sendTransactionStatusUpdate(userEmail: string, transaction: Transaction): Promise<void> {
    try {
      const subject = `Transaction Status Updated - ${transaction.id}`;
      const html = this.generateTransactionStatusChangeEmail(transaction);

      await this.transporter.sendMail({
        from: process.env.FROM_EMAIL,
        to: userEmail,
        subject,
        html
      });

      logger.info('Transaction status change email sent', {
        transactionId: transaction.id,
        userEmail: userEmail,
        status: transaction.status
      });
    } catch (error: any) {
      logger.error('Failed to send transaction status change email', {
        error: error.message,
        transactionId: transaction.id,
        userEmail: userEmail
      });
    }
  }

  // Original method for backward compatibility
  async sendFraudAlertWithAlert(alert: FraudAlert, user: User): Promise<void> {
    try {
      const subject = `Fraud Alert: ${alert.alertType} - ${alert.severity.toUpperCase()}`;
      const html = this.generateFraudAlertEmail(alert, user);

      await this.transporter.sendMail({
        from: process.env.FROM_EMAIL,
        to: user.email,
        subject,
        html
      });

      logger.info('Fraud alert email sent', {
        userId: user.id,
        alertId: alert.id,
        alertType: alert.alertType
      });
    } catch (error: any) {
      logger.error('Failed to send fraud alert email', {
        error: error.message,
        userId: user.id,
        alertId: alert.id
      });
    }
  }

  async sendWelcomeEmail(user: User): Promise<void> {
    try {
      const subject = 'Welcome to SecureTrace AI';
      const html = this.generateWelcomeEmail(user);

      await this.transporter.sendMail({
        from: process.env.FROM_EMAIL,
        to: user.email,
        subject,
        html
      });

      logger.info('Welcome email sent', { userId: user.id });
    } catch (error: any) {
      logger.error('Failed to send welcome email', {
        error: error.message,
        userId: user.id
      });
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    try {
      const subject = 'Password Reset Request';
      const html = this.generatePasswordResetEmail(resetToken);

      await this.transporter.sendMail({
        from: process.env.FROM_EMAIL,
        to: email,
        subject,
        html
      });

      logger.info('Password reset email sent', { email });
    } catch (error: any) {
      logger.error('Failed to send password reset email', {
        error: error.message,
        email
      });
    }
  }

  async sendComplianceReport(recipients: string[], reportData: any): Promise<void> {
    try {
      const subject = `Compliance Report - ${new Date().toLocaleDateString()}`;
      const html = this.generateComplianceReportEmail(reportData);

      for (const recipient of recipients) {
        await this.transporter.sendMail({
          from: process.env.FROM_EMAIL,
          to: recipient,
          subject,
          html
        });
      }

      logger.info('Compliance report sent', { recipientCount: recipients.length });
    } catch (error: any) {
      logger.error('Failed to send compliance report', { error: error.message });
    }
  }

  private generateFraudAlertEmailByTransaction(transaction: Transaction): string {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #d32f2f;">Fraud Alert Notification</h2>
            <div style="background-color: #ffebee; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Alert Type:</strong> High Risk Transaction</p>
              <p><strong>Severity:</strong> <span style="color: #d32f2f; text-transform: uppercase;">HIGH</span></p>
              <p><strong>Risk Score:</strong> ${Math.round((transaction.riskScore || 0) * 100)}%</p>
              <p><strong>Transaction ID:</strong> ${transaction.id}</p>
              <p><strong>Amount:</strong> ${transaction.amount} ${transaction.currency}</p>
              <p><strong>Status:</strong> ${transaction.status}</p>
              <p><strong>Time:</strong> ${transaction.timestamp}</p>
            </div>
            <p>We've detected potentially fraudulent activity on your account. Please review this transaction immediately.</p>
            <div style="margin: 30px 0;">
              <a href="${process.env.APP_URL}/dashboard/transactions/${transaction.id}" 
                 style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Review Transaction
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              If you believe this alert was triggered in error, please contact our support team immediately.
            </p>
          </div>
        </body>
      </html>
    `;
  }

  private generateTransactionStatusChangeEmail(transaction: Transaction): string {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1976d2;">Transaction Status Update</h2>
            <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Transaction ID:</strong> ${transaction.id}</p>
              <p><strong>Amount:</strong> ${transaction.amount} ${transaction.currency}</p>
              <p><strong>New Status:</strong> <span style="text-transform: uppercase; font-weight: bold;">${transaction.status}</span></p>
              <p><strong>Updated:</strong> ${new Date().toISOString()}</p>
            </div>
            <p>Your transaction status has been updated. You can view more details in your dashboard.</p>
            <div style="margin: 30px 0;">
              <a href="${process.env.APP_URL}/dashboard/transactions/${transaction.id}" 
                 style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                View Transaction Details
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              If you have any questions about this status change, please contact our support team.
            </p>
          </div>
        </body>
      </html>
    `;
  }

  private generateFraudAlertEmail(alert: FraudAlert, user: User): string {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #d32f2f;">Fraud Alert Notification</h2>
            <div style="background-color: #ffebee; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Alert Type:</strong> ${alert.alertType}</p>
              <p><strong>Severity:</strong> <span style="color: #d32f2f; text-transform: uppercase;">${alert.severity}</span></p>
              <p><strong>Risk Score:</strong> ${Math.round(alert.riskScore * 100)}%</p>
              <p><strong>Transaction ID:</strong> ${alert.transactionId}</p>
              <p><strong>Time:</strong> ${alert.createdAt}</p>
            </div>
            <p>Hi ${user.firstName},</p>
            <p>We've detected potentially fraudulent activity on your account. Please review this transaction immediately.</p>
            <div style="margin: 30px 0;">
              <a href="${process.env.APP_URL}/dashboard/alerts/${alert.id}" 
                 style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Review Alert
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              If you believe this alert was triggered in error, please contact our support team immediately.
            </p>
          </div>
        </body>
      </html>
    `;
  }

  private generateWelcomeEmail(user: User): string {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1976d2;">Welcome to SecureTrace AI</h2>
            <p>Hi ${user.firstName},</p>
            <p>Welcome to SecureTrace AI! Your account has been successfully created and our advanced fraud protection is now active.</p>
            <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3>Your Protection Features:</h3>
              <ul>
                <li>Real-time transaction monitoring</li>
                <li>Behavioral analysis and pattern recognition</li>
                <li>Device and location consistency checks</li>
                <li>Instant fraud alerts</li>
              </ul>
            </div>
            <div style="margin: 30px 0;">
              <a href="${process.env.APP_URL}/dashboard" 
                 style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Access Your Dashboard
              </a>
            </div>
            <p>If you have any questions, our support team is here to help.</p>
          </div>
        </body>
      </html>
    `;
  }

  private generatePasswordResetEmail(resetToken: string): string {
    const resetUrl = `${process.env.APP_URL}/reset-password?token=${resetToken}`;
    return `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1976d2;">Password Reset Request</h2>
            <p>You have requested to reset your password. Click the link below to create a new password:</p>
            <div style="margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              This link will expire in 1 hour. If you did not request this password reset, please ignore this email.
            </p>
          </div>
        </body>
      </html>
    `;
  }

  private generateComplianceReportEmail(reportData: any): string {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1976d2;">Compliance Report</h2>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Report Period:</strong> ${reportData.period}</p>
              <p><strong>Total Transactions:</strong> ${reportData.totalTransactions}</p>
              <p><strong>Fraud Cases Detected:</strong> ${reportData.fraudCases}</p>
              <p><strong>False Positives:</strong> ${reportData.falsePositives}</p>
              <p><strong>System Accuracy:</strong> ${reportData.accuracy}%</p>
            </div>
            <p>Please find the detailed compliance report attached to this email.</p>
          </div>
        </body>
      </html>
    `;
  }
}