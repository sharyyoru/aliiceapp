import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const SOAP_SYSTEM_PROMPT = `You are an AI medical scribe assistant specializing in converting doctor-patient consultation transcripts into structured SOAP notes. You work for aesthetics and medical clinics.

## Your Task
Analyze the consultation transcript and extract information into SOAP format:

### S - Subjective
- Chief complaint in patient's own words
- History of present illness
- Review of systems mentioned
- Relevant past medical/surgical history
- Allergies and medications mentioned
- Social/family history if relevant

### O - Objective  
- Any vital signs or measurements mentioned
- Physical examination findings
- Observations about patient appearance
- Test results discussed

### A - Assessment
- Primary diagnosis or working diagnosis
- Differential diagnoses if mentioned
- Clinical reasoning
- Suggest relevant ICD-10 codes

### P - Plan
- Treatment plan discussed
- Medications prescribed or recommended
- Procedures planned
- Follow-up instructions
- Patient education provided
- Referrals if any

## Guidelines
- Be concise but comprehensive
- Use medical terminology appropriately
- If information is not mentioned, indicate "Not documented"
- For aesthetics procedures, note treatment areas, products used, units/amounts
- Extract any mentioned ICD-10 codes or suggest appropriate ones
- List all medications discussed with dosages if mentioned
- Note any follow-up appointments discussed

## Output Format
Return a JSON object with this structure:
{
  "subjective": "string",
  "objective": "string", 
  "assessment": "string",
  "plan": "string",
  "icd10Codes": ["array of ICD-10 codes"],
  "medications": ["array of medications with dosages"],
  "followUp": "follow-up instructions"
}`;

type SOAPNotes = {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  icd10Codes: string[];
  medications: string[];
  followUp: string;
};

export async function POST(request: NextRequest) {
  try {
    const { transcript, patientId, patientName } = await request.json();

    if (!transcript) {
      return NextResponse.json(
        { error: "Transcript is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Return empty SOAP notes if no API key
      return NextResponse.json({
        soapNotes: {
          subjective: "Transcript recorded - AI processing unavailable",
          objective: "Not documented",
          assessment: "Review transcript for clinical assessment",
          plan: "Review transcript for treatment plan",
          icd10Codes: [],
          medications: [],
          followUp: "",
        },
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `${SOAP_SYSTEM_PROMPT}

Patient: ${patientName || "Unknown"}

## Consultation Transcript:
${transcript}

## Instructions:
Analyze this consultation transcript and generate SOAP notes. Return ONLY valid JSON with no additional text or markdown formatting.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Parse the JSON response
    let soapNotes: SOAPNotes;
    try {
      // Clean up the response - remove markdown code blocks if present
      let cleanJson = responseText.trim();
      if (cleanJson.startsWith("```json")) {
        cleanJson = cleanJson.replace(/^```json\n?/, "").replace(/\n?```$/, "");
      } else if (cleanJson.startsWith("```")) {
        cleanJson = cleanJson.replace(/^```\n?/, "").replace(/\n?```$/, "");
      }
      
      soapNotes = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error("Failed to parse SOAP notes JSON:", parseError);
      // Return a structured response from the raw text
      soapNotes = {
        subjective: responseText.substring(0, 500),
        objective: "See transcript",
        assessment: "Review required",
        plan: "Review required",
        icd10Codes: [],
        medications: [],
        followUp: "",
      };
    }

    // Validate and ensure all fields exist
    const validatedNotes: SOAPNotes = {
      subjective: soapNotes.subjective || "Not documented",
      objective: soapNotes.objective || "Not documented",
      assessment: soapNotes.assessment || "Not documented",
      plan: soapNotes.plan || "Not documented",
      icd10Codes: Array.isArray(soapNotes.icd10Codes) ? soapNotes.icd10Codes : [],
      medications: Array.isArray(soapNotes.medications) ? soapNotes.medications : [],
      followUp: soapNotes.followUp || "",
    };

    return NextResponse.json({ soapNotes: validatedNotes });

  } catch (error) {
    console.error("Error generating SOAP notes:", error);
    return NextResponse.json(
      { error: "Failed to generate SOAP notes" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/consultations/generate-soap",
    description: "Generates SOAP notes from consultation transcripts using AI",
  });
}
