import nodemailer from 'nodemailer';

// ============================================================================
// PASSWORD RESET EMAIL DISPATCHER UTILITY
// ============================================================================
// What this file does:
// Dispatches password reset emails containing secure reset URLs to teachers.
// Supports both real SMTP delivery (configured via environment variables)
// and fallback console logging for seamless local development and testing.
//
// Why it is needed:
// Allows teachers who forgot their password to receive a temporary reset link.
// Security Note:
// Secrets and SMTP passwords are never hard-coded; they are read from process.env.
// ============================================================================

export async function sendPasswordResetEmail(
  toEmail: string,
  resetUrl: string
): Promise<{ success: boolean; message: string }> {
  // Always log reset link to console during development/testing for instant verification.
  console.log('\n================================================================');
  console.log('🔒 PASSWORD RESET EMAIL SIMULATION (LOCAL DEVELOPMENT)');
  console.log('================================================================');
  console.log(`Recipient Email: ${toEmail}`);
  console.log(`Password Reset Link: ${resetUrl}`);
  console.log('================================================================\n');

  // Check if real SMTP server credentials are provided in environment variables.
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpHost && smtpUser && smtpPass) {
    try {
      // Create nodemailer SMTP transport using configured credentials.
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      // Construct email message body.
      const mailOptions = {
        from: process.env.SMTP_FROM || '"Reading Proficiency Assessment System" <noreply@reading-assessment.edu.ph>',
        to: toEmail,
        subject: 'Password Reset Request - Reading Proficiency Assessment System',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0f172a; color: #f8fafc; border-radius: 12px;">
            <h2 style="color: #2dd4bf; margin-top: 0;">Password Reset Request</h2>
            <p>Hello,</p>
            <p>You requested a password reset for your Teacher Account on the <strong>Reading Proficiency Assessment System</strong>.</p>
            <p>Please click the button below to set a new password. This link is valid for <strong>1 hour</strong>.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #0d9488; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
            </div>
            <p style="font-size: 12px; color: #94a3b8;">If the button does not work, copy and paste this URL into your browser:</p>
            <p style="font-size: 12px; color: #2dd4bf; word-break: break-all;">${resetUrl}</p>
            <hr style="border: 0; border-top: 1px solid #334155; margin: 20px 0;" />
            <p style="font-size: 11px; color: #64748b;">If you did not request a password reset, please ignore this email. Your account remains safe.</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
    } catch (err) {
      console.error('SMTP email dispatch error:', err);
      // Fallback log has already occurred above.
    }
  }

  return {
    success: true,
    message: 'If an account is associated with that email, a password reset link has been sent.',
  };
}
