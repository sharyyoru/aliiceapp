import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { patientId, patientName } = await request.json();
    
    const apiKey = process.env.RETELL_API_KEY;
    // Use dedicated medical scribe agent (silent listener mode)
    const agentId = process.env.RETELL_MEDICAL_AGENT_ID || "agent_aa8ff42dafb2185cd9364ffd78";

    if (!apiKey || !agentId) {
      return NextResponse.json(
        { error: "Retell configuration missing" },
        { status: 500 }
      );
    }

    // Create a web call with patient context
    const response = await fetch("https://api.retellai.com/v2/create-web-call", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        agent_id: agentId,
        metadata: {
          source: "medical_consultation",
          patient_id: patientId,
          patient_name: patientName,
          timestamp: new Date().toISOString(),
        },
        retell_llm_dynamic_variables: {
          patient_name: patientName,
          patient_id: patientId,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Retell API error:", error);
      return NextResponse.json(
        { error: "Failed to create consultation call" },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      access_token: data.access_token,
      call_id: data.call_id,
    });

  } catch (error) {
    console.error("Error creating consultation call:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
