import { Email } from "@convex-dev/auth/providers/Email";
import { Resend as ResendAPI } from "resend";

export const ResendOTPPasswordReset = Email({
  id: "resend-otp",
  apiKey: process.env.AUTH_RESEND_KEY || process.env.RESEND_API_KEY,

  async generateVerificationToken() {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return (array[0] % 1000000).toString().padStart(6, "0");
  },

  async sendVerificationRequest({ identifier: email, provider, token }: { identifier: string; provider: { apiKey?: string }; token: string }) {
    const resend = new ResendAPI(provider.apiKey as string);

    const emailHtml = `
      <!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset your password</title>
    <style>
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        background-color: #f4f7f6;
        margin: 0;
        padding: 40px 20px;
        color: #1f2937;
        -webkit-font-smoothing: antialiased;
      }
      .wrapper {
        max-width: 520px;
        margin: 0 auto;
      }
      .card {
        background: #ffffff;
        border-radius: 16px;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
        overflow: hidden;
      }
      .top-bar {
        height: 6px;
        background: linear-gradient(90deg, #337f37 0%, #129a77 100%);
        width: 100%;
      }
      .content {
        padding: 48px 40px;
      }
      .logo-container {
        margin-bottom: 32px;
      }
      .logo {
        font-size: 24px;
        font-weight: 800;
        color: #337f37;
        letter-spacing: -0.5px;
        margin: 0;
      }
      .title {
        font-size: 22px;
        font-weight: 700;
        color: #111827;
        margin: 0 0 12px 0;
      }
      .text {
        font-size: 15px;
        line-height: 1.6;
        color: #4b5563;
        margin: 0 0 32px 0;
      }
      .otp-box {
        background-color: #f8fafc;
        border: 2px dashed #cbd5e1;
        border-radius: 12px;
        padding: 32px 24px;
        text-align: center;
        margin-bottom: 32px;
      }
      .otp-label {
        font-size: 12px;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 1.5px;
        margin-bottom: 12px;
      }
      .otp-code {
        font-size: 42px;
        font-weight: 800;
        color: #424242;
        letter-spacing: 12px;
        font-family: 'Courier New', Courier, monospace;
        margin: 0;
        text-indent: 12px; /* ช่วยให้ตัวอักษรอยู่กึ่งกลางพอดีเวลาใช้ letter-spacing */
      }
      .divider {
        height: 1px;
        background-color: #e5e7eb;
        margin: 32px 0;
      }
      .security-note {
        display: flex;
        align-items: flex-start;
        background-color: #f9fafb;
        border-left: 4px solid #f59e0b;
        padding: 16px;
        border-radius: 0 8px 8px 0;
        font-size: 13px;
        line-height: 1.5;
        color: #6b7280;
      }
      .security-note strong {
        color: #374151;
      }
      .footer {
        padding: 32px 40px;
        text-align: center;
      }
      .footer-text {
        font-size: 13px;
        color: #9ca3af;
        margin: 0;
      }
      .footer-link {
        color: #337f37;
        text-decoration: none;
        font-weight: 500;
      }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="card">
        <div class="top-bar"></div>
        <div class="content">
          <div class="logo-container">
            <h1 class="logo">CT Workspace</h1>
          </div>
          
          <h2 class="title">Reset your password</h2>
          <p class="text">
            We received a request to reset the password for your account. If you made this request, please use the following verification code to securely set a new password.
          </p>
          
          <div class="otp-box">
            <div class="otp-label">Verification Code</div>
            <div class="otp-code">${token}</div>
          </div>
          
          <div class="security-note">
            <div>
              <strong>Security Notice:</strong> This code will expire in 15 minutes. If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
            </div>
          </div>
        </div>
      </div>
      
      <div class="footer">
        <p class="footer-text">
          &copy; 2026 CT Workspace. All rights reserved.<br>
          Designed for seamless collaboration.
        </p>
      </div>
    </div>
  </body>
</html>
    `;

    const { error } = await resend.emails.send({
      from: "CT Support <security@ctworkspace.online>",
      to: [email],
      subject: `Reset your password in CT Workspace`,
      html: emailHtml,
      text: `Your password reset code is: ${token}\n\nThis code will expire in 15 minutes. If you didn't request this reset, please ignore this email.`,
    });

    if (error) {
      console.error("Resend error:", error);
      throw new Error("Could not send password reset email");
    }
  },
});