import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { syncAppointmentMeet } from "@/lib/googleMeet";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-key"
);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Only allow updating specific fields
    const allowedFields = ["end_time", "start_time", "status", "reason", "notes", "location", "provider_id"];
    const updateData: Record<string, unknown> = {};
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }
    
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }
    
    const { data, error } = await supabase
      .from("appointments")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating appointment:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (data?.google_event_id && ("start_time" in updateData || "end_time" in updateData || "status" in updateData)) {
      await syncAppointmentMeet(id);
    }
    
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error in PATCH /api/appointments/[id]:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const { data, error } = await supabase
      .from("appointments")
      .select(`
        *,
        patient:patients(id, first_name, last_name, email, phone),
        provider:providers(id, name, specialty)
      `)
      .eq("id", id)
      .single();
    
    if (error) {
      console.error("Error fetching appointment:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    if (!data) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }
    
    // Video-call links are only served through the authenticated Google Meet endpoint.
    const { meet_link: _meetLink, google_event_id: _eventId, google_event_owner: _owner, ...publicData } = data;
    void _meetLink; void _eventId; void _owner;
    return NextResponse.json(publicData);
  } catch (err) {
    console.error("Error in GET /api/appointments/[id]:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
