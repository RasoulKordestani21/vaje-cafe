import nodemailer from "nodemailer";

// Configuration for email
const emailConfig = {
  service: process.env.SMTP_SERVICE || "gmail",
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
};

let transporter: nodemailer.Transporter | null = null;

export function getEmailTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport(emailConfig);
  }
  return transporter;
}

interface SendOTPEmailParams {
  email: string;
  otp: string;
  name?: string;
}

export async function sendOTPEmail({
  email,
  otp,
  name = "مدیر"
}: SendOTPEmailParams): Promise<boolean> {
  try {
    // Check if SMTP is configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.error("SMTP credentials not configured. Check .env.local file.");
      console.error("SMTP_USER:", process.env.SMTP_USER);
      console.error("SMTP_PASSWORD:", process.env.SMTP_PASSWORD);
      return false;
    }

    const transporter = getEmailTransporter();

    const mailOptions = {
      from: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
      to: email,
      subject: "کد بازیابی رمز عبور - وژه کافه",
      html: `
        <div style="direction: rtl; font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
          <div style="background-color: white; max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #333; margin: 0; font-size: 28px;">وژه کافه</h1>
              <p style="color: #666; font-size: 14px; margin: 5px 0 0 0;">سیستم مدیریت</p>
            </div>
            
            <h2 style="color: #333; text-align: center; margin-bottom: 20px;">درخواست بازیابی رمز عبور</h2>
            
            <p style="color: #555; font-size: 16px; line-height: 1.6; text-align: right;">
              سلام ${name}،
            </p>
            
            <p style="color: #555; font-size: 16px; line-height: 1.6; text-align: right;">
              برای بازیابی رمز عبور خود، از کد زیر استفاده کنید:
            </p>
            
            <div style="background-color: #f0f0f0; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
              <p style="font-size: 32px; font-weight: bold; color: #2c3e50; letter-spacing: 3px; margin: 0;">
                ${otp}
              </p>
            </div>
            
            <p style="color: #888; font-size: 14px; text-align: center; margin: 20px 0;">
              این کد تا 10 دقیقه معتبر است.
            </p>
            
            <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 30px;">
              <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                اگر این درخواست را شما نکردید، لطفا از آن صرف نظر کنید.
              </p>
            </div>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error("❌ Failed to send OTP email:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return false;
  }
}

interface SendWelcomeEmailParams {
  email: string;
  name: string;
  tempPassword?: string;
}

export async function sendWelcomeEmail({
  email,
  name,
  tempPassword
}: SendWelcomeEmailParams): Promise<boolean> {
  try {
    const transporter = getEmailTransporter();

    const mailOptions = {
      from: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
      to: email,
      subject: "خوش آمدید - وژه کافه",
      html: `
        <div style="direction: rtl; font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
          <div style="background-color: white; max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #333; text-align: center;">به وژه کافه خوش آمدید</h1>
            
            <p style="color: #555; font-size: 16px; line-height: 1.6;">
              سلام ${name}،
            </p>
            
            <p style="color: #555; font-size: 16px; line-height: 1.6;">
              حساب مدیریتی شما با موفقیت ایجاد شد.
            </p>
            
            ${
              tempPassword
                ? `
              <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #ffc107;">
                <p style="color: #856404; margin: 0; font-weight: bold;">رمز عبور موقتی:</p>
                <p style="color: #856404; font-size: 16px; letter-spacing: 2px; margin: 10px 0 0 0;">
                  ${tempPassword}
                </p>
              </div>
            `
                : ""
            }
            
            <p style="color: #555; font-size: 14px; margin-top: 30px;">
              لطفا برای امنیت بیشتر رمز عبور خود را تغییر دهید.
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("Failed to send welcome email:", error);
    return false;
  }
}

export async function testEmailConnection(): Promise<boolean> {
  try {
    const transporter = getEmailTransporter();
    await transporter.verify();
    console.log("Email service is ready");
    return true;
  } catch (error) {
    console.error("Email service error:", error);
    return false;
  }
}
