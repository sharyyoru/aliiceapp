import { NextResponse } from "next/server";

export async function POST() {
  try {
    const apiKey = process.env.RETELL_API_KEY;
    const agentId = process.env.RETELL_AGENT_ID;

    if (!apiKey || !agentId) {
      return NextResponse.json(
        { error: "Retell configuration missing" },
        { status: 500 }
      );
    }

    // Create a web call using Retell API
    const response = await fetch("https://api.retellai.com/v2/create-web-call", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        agent_id: agentId,
        metadata: {
          source: "aliice_web_widget",
          timestamp: new Date().toISOString(),
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Retell API error:", error);
      return NextResponse.json(
        { error: "Failed to create web call" },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      access_token: data.access_token,
      call_id: data.call_id,
    });

  } catch (error) {
    console.error("Error creating Retell web call:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/retell/create-web-call",
    method: "POST",
    description: "Creates a web call session for Retell AI voice agent",
  });
}
