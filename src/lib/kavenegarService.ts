/**
 * Kavenegar SMS Service
 * Handles SMS sending via Kavenegar API for OTP authentication
 */

interface KavenegarConfig {
  apiKey: string;
  sender: string; // Sender number (must be verified in Kavenegar panel)
}

interface SendOTPParams {
  phoneNumber: string;
  otp: string;
  template?: string; // Optional template name
}

interface SendSMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

class KavenegarService {
  private apiKey: string;
  private sender: string;
  private baseUrl = "https://api.kavenegar.com/v1";

  constructor(config: KavenegarConfig) {
    this.apiKey = config.apiKey;
    this.sender = config.sender;
  }

  /**
   * Normalize phone number to Iranian format (09xxxxxxxxx)
   */
  private normalizePhoneNumber(phone: string): string {
    // Remove all non-digit characters
    let normalized = phone.replace(/\D/g, "");

    // If starts with +98, replace with 0
    if (normalized.startsWith("98")) {
      normalized = "0" + normalized.substring(2);
    }

    // If doesn't start with 0, add it
    if (!normalized.startsWith("0")) {
      normalized = "0" + normalized;
    }

    // Validate Iranian mobile number format (09xxxxxxxxx)
    if (!/^09\d{9}$/.test(normalized)) {
      throw new Error("فرمت شماره موبایل نامعتبر است");
    }

    return normalized;
  }

  /**
   * Send OTP via SMS using Kavenegar API
   */
  async sendOTP({ phoneNumber, otp, template }: SendOTPParams): Promise<SendSMSResponse> {
    try {
      const normalizedPhone = this.normalizePhoneNumber(phoneNumber);

      // If template is provided, use template API
      if (template) {
        return await this.sendWithTemplate(normalizedPhone, template, { token: otp });
      }

      // Otherwise, use simple SMS API
      const message = `کد ورود شما: ${otp}\nاین کد ۱۰ دقیقه معتبر است.\nکافه واژه`;

      return await this.sendSimpleSMS(normalizedPhone, message);
    } catch (error: any) {
      console.error("Kavenegar SMS error:", error);
      return {
        success: false,
        error: error.message || "خطا در ارسال پیامک"
      };
    }
  }

  /**
   * Send SMS using Kavenegar simple SMS API
   */
  private async sendSimpleSMS(
    phoneNumber: string,
    message: string
  ): Promise<SendSMSResponse> {
    try {
      const url = `${this.baseUrl}/${this.apiKey}/sms/send.json`;

      const params = new URLSearchParams({
        sender: this.sender,
        receptor: phoneNumber,
        message: message
      });

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: params.toString()
      });

      const data = await response.json();

      if (data.return?.status === 200) {
        return {
          success: true,
          messageId: data.entry?.messageid?.toString()
        };
      } else {
        return {
          success: false,
          error: data.return?.message || "خطا در ارسال پیامک"
        };
      }
    } catch (error: any) {
      console.error("Kavenegar API error:", error);
      return {
        success: false,
        error: error.message || "خطا در ارتباط با سرویس پیامک"
      };
    }
  }

  /**
   * Send SMS using Kavenegar template API
   */
  private async sendWithTemplate(
    phoneNumber: string,
    template: string,
    tokens: Record<string, string>
  ): Promise<SendSMSResponse> {
    try {
      const url = `${this.baseUrl}/${this.apiKey}/verify/lookup.json`;

      const params = new URLSearchParams({
        receptor: phoneNumber,
        token: tokens.token || "",
        template: template
      });

      // Add additional tokens if needed
      Object.entries(tokens).forEach(([key, value], index) => {
        if (key !== "token" && index < 2) {
          // Kavenegar supports token, token2, token3
          params.append(`token${index + 2}`, value);
        }
      });

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: params.toString()
      });

      const data = await response.json();

      if (data.return?.status === 200) {
        return {
          success: true,
          messageId: data.entry?.messageid?.toString()
        };
      } else {
        return {
          success: false,
          error: data.return?.message || "خطا در ارسال پیامک"
        };
      }
    } catch (error: any) {
      console.error("Kavenegar template API error:", error);
      return {
        success: false,
        error: error.message || "خطا در ارتباط با سرویس پیامک"
      };
    }
  }
}

// Create singleton instance
let kavenegarInstance: KavenegarService | null = null;

export function getKavenegarService(): KavenegarService {
  if (!kavenegarInstance) {
    const apiKey = process.env.KAVENEGAR_API_KEY || "";
    const sender = process.env.KAVENEGAR_SENDER || "10004346"; // Default Kavenegar sender

    if (!apiKey) {
      console.warn("KAVENEGAR_API_KEY not set. SMS functionality will not work.");
    }

    kavenegarInstance = new KavenegarService({
      apiKey,
      sender
    });
  }

  return kavenegarInstance;
}

export { KavenegarService, SendOTPParams, SendSMSResponse };




