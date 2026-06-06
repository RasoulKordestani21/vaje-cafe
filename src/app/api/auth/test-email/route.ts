import { NextRequest, NextResponse } from "next/server";
import { getEmailTransporter } from "@/lib/emailService";

/**
 * Test SMTP Connection
 * GET /api/auth/test-email
 * 
 * Returns: SMTP configuration status and connection test result
 */
export async function GET(request: NextRequest) {
  try {
    const smtpConfig = {
      service: process.env.SMTP_SERVICE,
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE,
      user: process.env.SMTP_USER,
      fromEmail: process.env.SMTP_FROM_EMAIL,
      nodeEnv: process.env.NODE_ENV,
      configured: !!(process.env.SMTP_USER && process.env.SMTP_PASSWORD),
    };

    // Try to verify transporter
    let smtpVerified = false;
    let verifyError = null;

    try {
      const transporter = getEmailTransporter();
      await transporter.verify();
      smtpVerified = true;
    } catch (error) {
      verifyError = error instanceof Error ? error.message : String(error);
    }

    return NextResponse.json(
      {
        status: smtpVerified ? "✅ OK" : "❌ ERROR",
        smtpConfig: {
          ...smtpConfig,
          password: process.env.SMTP_PASSWORD ? "***configured***" : "NOT SET",
        },
        smtpVerified,
        verifyError,
        message: smtpVerified
          ? "SMTP is configured and working correctly"
          : "SMTP configuration failed. Check the error below.",
      },
      { status: smtpVerified ? 200 : 500 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "❌ ERROR",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * Send Test Email
 * POST /api/auth/test-email
 * 
 * Request body:
 * { "email": "test@example.com" }
 * 
 * Response: Status of test email sending
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email address required in request body" },
        { status: 400 }
      );
    }

    // Check configuration
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      return NextResponse.json(
        {
          status: "❌ ERROR",
          error: "SMTP credentials not configured",
          details:
            "Please set SMTP_USER and SMTP_PASSWORD in .env.local file",
        },
        { status: 400 }
      );
    }

    try {
      const transporter = getEmailTransporter();

      const result = await transporter.sendMail({
        from: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
        to: email,
        subject: "Test Email - وژه کافه",
        html: `
          <div style="direction: rtl; font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
            <div style="background-color: white; max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 10px;">
              <h1 style="color: #333; text-align: center;">تست ایمیل - وژه کافه</h1>
              <p style="color: #555; text-align: center; margin-top: 20px;">
                ✅ سیستم ارسال ایمیل به درستی کار می‌کند
              </p>
              <p style="color: #888; font-size: 12px; text-align: center; margin-top: 30px;">
                زمان ارسال: ${new Date().toLocaleString('fa-IR')}
              </p>
            </div>
          </div>
        `,
      });

      return NextResponse.json(
        {
          status: "✅ SUCCESS",
          message: "Test email sent successfully",
          messageId: result.messageId,
          email,
        },
        { status: 200 }
      );
    } catch (sendError) {
      return NextResponse.json(
        {
          status: "❌ ERROR",
          error: "Failed to send email",
          details: sendError instanceof Error ? sendError.message : String(sendError),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        status: "❌ ERROR",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
