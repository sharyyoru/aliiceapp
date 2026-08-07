/**
 * Centralized Email Service
 * 
 * This module provides a unified email sending interface that:
 * 1. Uses Gmail API as the PRIMARY method (via connected admin accounts)
 * 2. Falls back to Resend API if Gmail is not available
 * 
 * Environment variables:
 * - GOOGLE_CLIENT_ID: Gmail OAuth client ID
 * - GOOGLE_CLIENT_SECRET: Gmail OAuth client secret
 * - SYSTEM_GMAIL_ADMIN_EMAIL: Default admin email for system emails
 * - RESEND_API_KEY: (Optional) Resend API key for fallback
 * - EMAIL_FROM_ADDRESS: Default from address
 * - EMAIL_FROM_NAME: Default from name
 */

import { getValidAccessToken, sendGmailMessage, sendSystemEmail as sendGmailSystemEmail, isGmailConfigured } from "@/lib/gmail";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_API_URL = "https://api.resend.com/emails";

// Default sender configuration
const DEFAULT_FROM_EMAIL = process.env.EMAIL_FROM_ADDRESS || "info@mail.maisontoa.com";
const DEFAULT_FROM_NAME = process.env.EMAIL_FROM_NAME || "Maison Toa";

export type EmailAttachment = {
  filename: string;
  content: string; // Base64 encoded content
  contentType?: string;
};

export type SendEmailOptions = {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  html: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
  tags?: { name: string; value: string }[];
  scheduledAt?: Date; // ISO 8601 format for scheduled delivery
};

export type SendEmailResult = {
  success: boolean;
  messageId?: string;
  threadId?: string;
  rfc822MessageId?: string;
  error?: string;
  scheduled?: boolean;
  provider?: "gmail" | "resend";
};

/**
 * Check if email service is configured (Gmail or Resend)
 */
export function isEmailConfigured(): boolean {
  return isGmailConfigured() || !!RESEND_API_KEY;
}

/**
 * Check if Resend is configured (for fallback)
 */
export function isResendConfigured(): boolean {
  return !!RESEND_API_KEY;
}

/**
 * Basic RFC-5322-style email validation used to guard against sending
 * malformed addresses to Resend (which rejects the whole request).
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: unknown): value is string {
  return typeof value === "string" && EMAIL_REGEX.test(value.trim());
}

/**
 * Keep only valid, trimmed email addresses from a string or array.
 */
function filterValidEmails(e?: string | string[]): string[] {
  if (!e) return [];
  const arr = Array.isArray(e) ? e : [e];
  return arr
    .filter(Boolean)
    .map((s) => s.trim())
    .filter((s) => isValidEmail(s));
}

/**
 * Send an email using Resend
 * 
 * @example
 * ```typescript
 * const result = await sendEmail({
 *   to: "patient@example.com",
 *   subject: "Appointment Confirmation",
 *   html: "<h1>Your appointment is confirmed</h1>",
 * });
 * ```
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  if (!RESEND_API_KEY) {
    console.warn("[Email] Resend not configured (missing RESEND_API_KEY), skipping email send");
    return { success: false, error: "Email service not configured" };
  }

  const {
    to,
    cc,
    bcc,
    subject,
    html,
    from,
    fromName,
    replyTo,
    attachments,
    tags,
    scheduledAt,
  } = options;

  // Build the from address, falling back to the verified default if invalid
  let fromAddress = (from || DEFAULT_FROM_EMAIL).trim();
  if (!isValidEmail(fromAddress)) {
    console.warn(`[Email] Invalid from address "${fromAddress}", falling back to default`);
    fromAddress = DEFAULT_FROM_EMAIL;
  }
  const senderName = fromName || DEFAULT_FROM_NAME;
  const fromField = `${senderName} <${fromAddress}>`;

  // Validate recipients: drop malformed addresses so one bad entry does not
  // cause Resend to reject the entire request.
  const toList = filterValidEmails(to);
  if (toList.length === 0) {
    return { success: false, error: "No valid recipient email address provided" };
  }

  // Build request body
  const body: Record<string, unknown> = {
    from: fromField,
    to: toList,
    subject,
    html,
  };

  const ccList = filterValidEmails(cc);
  const bccList = filterValidEmails(bcc);
  if (ccList.length > 0) body.cc = ccList;
  if (bccList.length > 0) body.bcc = bccList;

  // Only attach reply_to when it is a valid email; never fail the send over it.
  if (replyTo) {
    if (isValidEmail(replyTo)) {
      body.reply_to = replyTo.trim();
    } else {
      console.warn(`[Email] Invalid replyTo "${replyTo}" omitted from send`);
    }
  }

  if (attachments && attachments.length > 0) {
    body.attachments = attachments.map((att) => ({
      filename: att.filename,
      content: att.content,
      content_type: att.contentType || "application/octet-stream",
    }));
  }

  if (tags && tags.length > 0) {
    body.tags = tags;
  }

  // Resend supports scheduling up to 72 hours in advance
  if (scheduledAt) {
    const now = Date.now();
    const scheduleTime = scheduledAt.getTime();
    const maxScheduleTime = now + 72 * 60 * 60 * 1000; // 72 hours

    if (scheduleTime > now && scheduleTime <= maxScheduleTime) {
      body.scheduled_at = scheduledAt.toISOString();
    } else if (scheduleTime > maxScheduleTime) {
      // Beyond 72 hours - will be handled by cron job
      console.log(`[Email] Scheduled for ${scheduledAt.toISOString()} is beyond Resend's 72-hour limit`);
      return { success: false, scheduled: true, error: "Beyond 72-hour limit, stored for cron job" };
    }
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[Email] Resend API error:", response.status, data);
      return {
        success: false,
        error: data.message || `Resend error: ${response.status}`,
      };
    }

    console.log("[Email] Sent successfully:", { to, subject, messageId: data.id });
    return {
      success: true,
      messageId: data.id,
      scheduled: !!scheduledAt,
    };
  } catch (error) {
    console.error("[Email] Failed to send:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send a batch of emails (up to 100 at a time)
 * Useful for marketing campaigns
 */
export async function sendBatchEmails(
  emails: SendEmailOptions[]
): Promise<{ success: boolean; results: SendEmailResult[]; sent: number; failed: number }> {
  if (!RESEND_API_KEY) {
    return {
      success: false,
      results: emails.map(() => ({ success: false, error: "Email service not configured" })),
      sent: 0,
      failed: emails.length,
    };
  }

  // Resend batch endpoint supports up to 100 emails
  const BATCH_SIZE = 100;
  const results: SendEmailResult[] = [];
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const batch = emails.slice(i, i + BATCH_SIZE);
    
    // For batches, we send individually to track results per recipient
    // Resend's batch API doesn't support per-email tracking as well
    const batchPromises = batch.map((email) => sendEmail(email));
    const batchResults = await Promise.all(batchPromises);
    
    for (const result of batchResults) {
      results.push(result);
      if (result.success) {
        sent++;
      } else {
        failed++;
      }
    }

    // Small delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < emails.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return {
    success: failed === 0,
    results,
    sent,
    failed,
  };
}

/**
 * Utility to add tracking pixel to HTML email
 */
export function addTrackingPixel(html: string, emailId: string, appUrl: string): string {
  const trackingPixel = `<img src="${appUrl}/api/emails/track?id=${emailId}" width="1" height="1" style="display:none;visibility:hidden;width:1px;height:1px;opacity:0;" alt="" />`;
  
  if (html.includes("</body>")) {
    return html.replace("</body>", `${trackingPixel}</body>`);
  }
  return `${html}${trackingPixel}`;
}

/**
 * Sanitize tel: links for iPhone compatibility
 */
export function sanitizeTelLinks(html: string): string {
  // Decode any URL-encoded tel: protocols
  let result = html.replace(/href\s*=\s*(["'])tel%3A/gi, 'href=$1tel:');
  result = result.replace(/href\s*=\s*(["'])tel:%2B/gi, 'href=$1tel:+');
  
  // Clean phone numbers for iPhone compatibility
  result = result.replace(
    /href\s*=\s*["']tel:([^"']+)["']/gi,
    (_match, phoneNumber) => {
      let decoded = phoneNumber;
      try {
        decoded = decodeURIComponent(phoneNumber);
      } catch {
        // If decoding fails, use original
      }
      decoded = decoded
        .replace(/&nbsp;/gi, '')
        .replace(/&#160;/g, '')
        .replace(/&amp;/gi, '&')
        .replace(/&plus;/gi, '+')
        .replace(/\u00A0/g, '');
      
      const cleaned = decoded.replace(/[^0-9+]/g, '');
      return `href="tel:${cleaned}"`;
    }
  );
  
  return result;
}

/**
 * Extended options for unified email sending
 */
export type UnifiedEmailOptions = SendEmailOptions & {
  adminEmail?: string;  // Admin email to look up Gmail account
  threadId?: string;    // Gmail thread ID for replies
  inReplyTo?: string;   // RFC822 Message-ID for threading
  references?: string;  // References header for threading
};

/**
 * Unified email sending - Gmail first, Resend fallback
 * 
 * This is the PRIMARY method for sending emails. It:
 * 1. Tries to send via Gmail if an admin account is available
 * 2. Falls back to Resend if Gmail is not configured or fails
 * 
 * @param options - Email options including optional adminEmail for Gmail lookup
 */
export async function sendUnifiedEmail(options: UnifiedEmailOptions): Promise<SendEmailResult> {
  const {
    to,
    cc,
    bcc,
    subject,
    html,
    from,
    fromName,
    replyTo,
    attachments,
    adminEmail,
    threadId,
    inReplyTo,
    references,
    scheduledAt,
  } = options;

  // Validate recipient
  const toList = filterValidEmails(to);
  if (toList.length === 0) {
    return { success: false, error: "No valid recipient email address provided" };
  }
  const recipient = toList[0]; // Gmail API expects single recipient for primary

  // Normalize CC/BCC
  const ccList = filterValidEmails(cc);
  const bccList = filterValidEmails(bcc);

  // Convert attachments to Gmail format
  const gmailAttachments = attachments?.map((att) => ({
    filename: att.filename,
    content: att.content,
    encoding: "base64" as const,
    contentType: att.contentType || "application/octet-stream",
  }));

  // Try Gmail first if admin email is provided
  if (adminEmail) {
    const gmailToken = await getValidAccessToken(adminEmail);
    if (gmailToken) {
      console.log(`[Email] Sending via Gmail (${gmailToken.googleEmail})`);
      
      const gmailResult = await sendGmailMessage(gmailToken.accessToken, {
        from: gmailToken.googleEmail,
        to: recipient,
        cc: ccList,
        bcc: bccList,
        subject,
        html,
        replyTo,
        attachments: gmailAttachments,
        threadId: threadId || null,
        inReplyTo: inReplyTo || null,
        references: references || null,
      });

      if (gmailResult.ok) {
        return {
          success: true,
          messageId: gmailResult.messageId,
          threadId: gmailResult.threadId,
          rfc822MessageId: gmailResult.rfc822MessageId,
          provider: "gmail",
        };
      }

      console.warn(`[Email] Gmail send failed: ${gmailResult.error}, trying fallback...`);
    }
  }

  // Try system Gmail account as fallback
  if (isGmailConfigured()) {
    console.log("[Email] Trying system Gmail account...");
    const systemResult = await sendGmailSystemEmail({
      to: recipient,
      cc: ccList,
      bcc: bccList,
      subject,
      html,
      replyTo,
      attachments: gmailAttachments,
    });

    if (systemResult.ok) {
      return {
        success: true,
        messageId: systemResult.messageId,
        threadId: systemResult.threadId,
        rfc822MessageId: systemResult.rfc822MessageId,
        provider: "gmail",
      };
    }

    console.warn(`[Email] System Gmail send failed: ${systemResult.error}`);
  }

  // Fall back to Resend
  if (RESEND_API_KEY) {
    console.log("[Email] Falling back to Resend...");
    const resendResult = await sendEmail(options);
    return {
      ...resendResult,
      provider: resendResult.success ? "resend" : undefined,
    };
  }

  return {
    success: false,
    error: "No email provider available. Connect Gmail or configure Resend.",
  };
}

/**
 * Send a system email (no user context) - uses system Gmail account
 * 
 * Use this for automated emails like:
 * - Appointment confirmations
 * - Booking notifications
 * - System alerts
 */
export async function sendSystemEmailUnified(options: Omit<SendEmailOptions, "from" | "fromName">): Promise<SendEmailResult> {
  const { to, cc, bcc, subject, html, replyTo, attachments } = options;

  // Validate recipient
  const toList = filterValidEmails(to);
  if (toList.length === 0) {
    return { success: false, error: "No valid recipient email address provided" };
  }
  const recipient = toList[0];

  const ccList = filterValidEmails(cc);
  const bccList = filterValidEmails(bcc);

  // Convert attachments to Gmail format
  const gmailAttachments = attachments?.map((att) => ({
    filename: att.filename,
    content: att.content,
    encoding: "base64" as const,
    contentType: att.contentType || "application/octet-stream",
  }));

  // Try system Gmail first
  if (isGmailConfigured()) {
    const result = await sendGmailSystemEmail({
      to: recipient,
      cc: ccList,
      bcc: bccList,
      subject,
      html,
      replyTo,
      attachments: gmailAttachments,
    });

    if (result.ok) {
      return {
        success: true,
        messageId: result.messageId,
        threadId: result.threadId,
        rfc822MessageId: result.rfc822MessageId,
        provider: "gmail",
      };
    }

    console.warn(`[Email] System Gmail failed: ${result.error}`);
  }

  // Fall back to Resend
  if (RESEND_API_KEY) {
    const result = await sendEmail({
      to: recipient,
      cc: ccList,
      bcc: bccList,
      subject,
      html,
      from: DEFAULT_FROM_EMAIL,
      fromName: DEFAULT_FROM_NAME,
      replyTo,
      attachments,
    });

    return {
      ...result,
      provider: result.success ? "resend" : undefined,
    };
  }

  return {
    success: false,
    error: "No email provider available. Connect Gmail or configure Resend.",
  };
}

// Re-export filterValidEmails for use in other modules
export { filterValidEmails };
