import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, company, phone, subject, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400 }
      );
    }

    // Format the email content
    const emailContent = `
New Contact Form Submission

From: ${name}
Email: ${email}
Company: ${company || "Not provided"}
Phone: ${phone || "Not provided"}
Subject: ${subject || "General Inquiry"}

Message:
${message}

---
Sent from Aliice Contact Form
    `.trim();

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #334155; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(to right, #0284c7, #7c3aed); padding: 20px; border-radius: 12px 12px 0 0; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; }
    .field { margin-bottom: 16px; }
    .label { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
    .value { font-size: 16px; color: #1e293b; }
    .message-box { background: white; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; margin-top: 16px; }
    .footer { text-align: center; padding-top: 16px; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📬 New Contact Form Submission</h1>
    </div>
    <div class="content">
      <div class="field">
        <div class="label">From</div>
        <div class="value">${name}</div>
      </div>
      <div class="field">
        <div class="label">Email</div>
        <div class="value"><a href="mailto:${email}">${email}</a></div>
      </div>
      <div class="field">
        <div class="label">Company</div>
        <div class="value">${company || "Not provided"}</div>
      </div>
      <div class="field">
        <div class="label">Phone</div>
        <div class="value">${phone || "Not provided"}</div>
      </div>
      <div class="field">
        <div class="label">Subject</div>
        <div class="value">${subject || "General Inquiry"}</div>
      </div>
      <div class="message-box">
        <div class="label">Message</div>
        <div class="value" style="white-space: pre-wrap;">${message}</div>
      </div>
      <div class="footer">
        Sent from Aliice Contact Form
      </div>
    </div>
  </div>
</body>
</html>
    `.trim();

    // Send email using centralized email service
    const result = await sendEmail({
      to: "sharyyoru@gmail.com",
      subject: `[Aliice Contact] ${subject || "General Inquiry"} - ${name}`,
      html: htmlContent,
      replyTo: email,
    });

    if (!result.success) {
      console.error("Email send error:", result.error);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id: result.messageId });

  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
