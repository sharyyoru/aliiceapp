import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const callId = request.nextUrl.searchParams.get("callId");
    
    if (!callId) {
      return NextResponse.json({ error: "Call ID required" }, { status: 400 });
    }

    const apiKey = process.env.RETELL_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "Retell configuration missing" }, { status: 500 });
    }

    // Fetch call details from Retell API
    const response = await fetch(`https://api.retellai.com/v2/get-call/${callId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Retell API error:", error);
      return NextResponse.json({ error: "Failed to fetch call" }, { status: response.status });
    }

    const data = await response.json();

    // Return the transcript
    return NextResponse.json({
      transcript: data.transcript_object || data.transcript || [],
      call_analysis: data.call_analysis || null,
      call_status: data.call_status,
      duration: data.end_timestamp && data.start_timestamp 
        ? Math.round((data.end_timestamp - data.start_timestamp) / 1000) 
        : null,
    });

  } catch (error) {
    console.error("Error fetching call transcript:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
