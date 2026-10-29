import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { getGmailAccount, hasCalendarScope, isGmailConfigured } from "@/lib/gmail";
import { listConnectedAdmins } from "@/lib/googleCalendar";
import { verifyAdminSession } from "@/lib/adminSession";

/**
 * GET /api/admin/agenda/accounts
 *   List connected admin calendars (for the legend / color coding) plus the
 *   current admin's own connection state.
 */
export async function GET() {
    if (!(await verifyAdminSession())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accounts = await listConnectedAdmins();
  const myAccount = await getGmailAccount(session.email);

  return NextResponse.json({
    configured: isGmailConfigured(),
    me: {
      adminEmail: session.email,
      connected: !!myAccount,
      hasCalendar: hasCalendarScope(myAccount?.scope),
      googleEmail: myAccount?.google_email || null,
    },
    accounts,
  });
}
