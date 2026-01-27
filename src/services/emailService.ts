// Email Service - Frontend Utility
// Connects to backend email service for sending notifications

const EMAIL_SERVICE_URL = import.meta.env.VITE_EMAIL_SERVICE_URL || 'http://localhost:3001/api/send-email';

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export const emailService = {
  /**
   * Send an email notification
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const response = await fetch(EMAIL_SERVICE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Failed to send email:', data.error);
        return false;
      }

      console.log('✅ Email sent successfully:', data.messageId);
      return true;
    } catch (error) {
      console.error('❌ Error sending email:', error);
      return false;
    }
  },

  /**
   * Send task assignment notification
   */
  async sendTaskAssignmentNotification(userEmail: string, userName: string, taskTitle: string, projectName: string): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e3a8a;">Neue Aufgabe zugewiesen</h2>
        <p>Hallo ${userName},</p>
        <p>Ihnen wurde eine neue Aufgabe zugewiesen:</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-left: 4px solid #1e3a8a; margin: 20px 0;">
          <strong>Aufgabe:</strong> ${taskTitle}<br>
          <strong>Projekt:</strong> ${projectName}
        </div>
        <p>Bitte melden Sie sich im AdencERP-System an, um weitere Details zu sehen.</p>
        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
          Dies ist eine automatische Benachrichtigung von AdencERP TimeTrack & Attendance System.
        </p>
      </div>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: `Neue Aufgabe: ${taskTitle}`,
      html,
      text: `Hallo ${userName},\n\nIhnen wurde eine neue Aufgabe zugewiesen:\nAufgabe: ${taskTitle}\nProjekt: ${projectName}\n\nBitte melden Sie sich im AdencERP-System an, um weitere Details zu sehen.`
    });
  },

  /**
   * Send project notification to all team members
   */
  async sendProjectNotification(emails: string[], projectName: string, message: string): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e3a8a;">Projekt-Update: ${projectName}</h2>
        <p>${message}</p>
        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
          Dies ist eine automatische Benachrichtigung von AdencERP TimeTrack & Attendance System.
        </p>
      </div>
    `;

    const promises = emails.map(email =>
      this.sendEmail({
        to: email,
        subject: `Projekt-Update: ${projectName}`,
        html,
        text: message
      })
    );

    const results = await Promise.all(promises);
    return results.every(result => result === true);
  }
};
