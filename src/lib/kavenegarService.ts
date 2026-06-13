/**
 * Kavenegar SMS Service
 * Sends OTP codes via Kavenegar REST API
 * Docs: https://app.kavenegar.com/sdk
 */

const BASE_URL = "https://api.kavenegar.com/v1";

interface SendSMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

class KavenegarService {
  private apiKey: string;
  private sender: string;

  constructor(apiKey: string, sender: string) {
    this.apiKey = apiKey;
    this.sender = sender;
  }

  /**
   * Normalize phone to 09xxxxxxxxx
   */
  private normalizePhone(phone: string): string {
    let n = phone.replace(/\D/g, "");
    if (n.startsWith("98")) n = "0" + n.slice(2);
    if (!n.startsWith("0")) n = "0" + n;
    if (!/^09\d{9}$/.test(n)) throw new Error("شماره موبایل نامعتبر است");
    return n;
  }

  /**
   * Send OTP via plain SMS  (no template needed)
   */
  async sendOTP({ phoneNumber, otp }: { phoneNumber: string; otp: string }): Promise<SendSMSResult> {
    try {
      const receptor = this.normalizePhone(phoneNumber);
      const message  = `کد ورود کافه واژه: ${otp}\nاین کد ۱۰ دقیقه معتبر است.`;

      const url    = `${BASE_URL}/${this.apiKey}/sms/send.json`;
      const params = new URLSearchParams({ sender: this.sender, receptor, message });

      const res  = await fetch(url, {
        method:  "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
        body:    params.toString(),
      });

      const data = await res.json();

      if (data.return?.status === 200) {
        return { success: true, messageId: data.entries?.[0]?.messageid?.toString() };
      }

      console.error("Kavenegar error:", data.return);
      return { success: false, error: data.return?.message || "خطا در ارسال پیامک" };
    } catch (err: any) {
      console.error("Kavenegar fetch error:", err);
      return { success: false, error: err.message || "خطا در ارتباط با سرویس پیامک" };
    }
  }

  /**
   * Send OTP via a verified Kavenegar template (verify/lookup)
   * templateName must be registered in your Kavenegar panel.
   */
  async sendOTPWithTemplate({
    phoneNumber,
    otp,
    template,
  }: {
    phoneNumber: string;
    otp: string;
    template: string;
  }): Promise<SendSMSResult> {
    try {
      const receptor = this.normalizePhone(phoneNumber);
      const url      = `${BASE_URL}/${this.apiKey}/verify/lookup.json`;
      const params   = new URLSearchParams({ receptor, token: otp, template });

      const res  = await fetch(url, {
        method:  "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
        body:    params.toString(),
      });

      const data = await res.json();

      if (data.return?.status === 200) {
        return { success: true, messageId: data.entries?.[0]?.messageid?.toString() };
      }

      console.error("Kavenegar template error:", data.return);
      return { success: false, error: data.return?.message || "خطا در ارسال پیامک" };
    } catch (err: any) {
      console.error("Kavenegar template fetch error:", err);
      return { success: false, error: err.message || "خطا در ارتباط با سرویس پیامک" };
    }
  }
}

// ── Singleton ──────────────────────────────────────────────────────────────────
let instance: KavenegarService | null = null;

export function getKavenegarService(): KavenegarService {
  if (!instance) {
    const apiKey = process.env.KAVENEGAR_API_KEY || "";
    const sender = process.env.KAVENEGAR_SENDER  || "10004346";

    if (!apiKey) {
      console.warn("[Kavenegar] KAVENEGAR_API_KEY is not set — SMS will not be sent.");
    }

    instance = new KavenegarService(apiKey, sender);
  }
  return instance;
}

export type { SendSMSResult };
