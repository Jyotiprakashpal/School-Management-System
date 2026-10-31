import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendPasswordResetEmail(email: string, resetToken: string, userName: string): Promise<void> {
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${encodeURIComponent(resetToken)}`;
  
  const mailOptions = {
    from: `"School Management System" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Password Reset Request - School Management System',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Password Reset Request</h1>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
            <p style="font-size: 16px; color: #333;">Hello <strong>${userName}</strong>,</p>
            <p style="font-size: 16px; color: #555;">We received a request to reset your password for your School Management System account. Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">Reset Password</a>
            </div>
            <p style="font-size: 14px; color: #888;">This link will expire in <strong>1 hour</strong> for security reasons.</p>
            <p style="font-size: 14px; color: #888;">If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">© 2024 School Management System. All rights reserved.</          </div>
        </body>
      </html>
    `,
    text: `
      Hello ${userName},
      
      We received a request to reset your password for your School Management System account.
      
      Please click the following link to reset your password:
      ${resetLink}
      
      This link will expire in 1 hour for security reasons.
      
      If you didn't request this password reset, please ignore this email or contact support if you have concerns.
      
      © 2024 School Management System. All rights reserved.
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
}

export async function sendPasswordChangedNotification(email: string, userName: string): Promise<void> {
  const mailOptions = {
    from: `"School Management System" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Your Password Has Been Changed - School Management System',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Password Successfully Changed</h1>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
            <p style="font-size: 16px; color: #333;">Hello <strong>${userName}</strong>,</p>
            <p style="font-size: 16px; color: #555;">Your password has been successfully changed. If you made this change, no further action is needed.</p>
            <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #92400e;"><strong>Security Notice:</strong> If you did not make this change, please contact our support team immediately.</p>
            </div>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">© 2024 School Management System. All rights reserved.</          </div>
        </body>
      </html>
    `,
    text: `
      Hello ${userName},
      
      Your password has been successfully changed. If you made this change, no further action is needed.
      
      If you did not make this change, please contact our support team immediately.
      
      © 2024 School Management System. All rights reserved.
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password changed notification sent to ${email}`);
  } catch (error) {
    console.error('Failed to send password changed notification:', error);
    throw new Error('Failed to send password changed notification');
  }
}
