import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// System prompt for Aliice - the AI assistant
const SYSTEM_PROMPT = `You are Aliice, the friendly and knowledgeable AI assistant for the ALiice Medical CRM platform. Your role is to help clinic owners and staff set up their system, answer questions, and guide them through features.

## About ALiice Platform
ALiice is a comprehensive medical CRM and clinic management system designed for aesthetics clinics. Key features include:

1. **Patient Management** - Add, search, and manage patient records with full medical history
2. **Appointment Scheduling** - Calendar system for booking consultations and treatments
3. **Services Catalog** - Define treatments, prices, and durations
4. **Online Booking Page** - Customizable landing page for patients to book appointments
5. **Deals & Pipeline** - CRM pipeline to track patient journey from lead to treatment
6. **Financial Management** - Invoicing, payments, and financial reports
7. **Task Management** - Assign and track tasks for team members
8. **Workflows** - Automate follow-ups and patient communications

## Onboarding Steps
Help users complete these setup steps in order:
1. **Add patients** - Go to /patients and click "Add Patient"
2. **Set up services** - Go to /services to define treatments offered
3. **Create booking page** - Go to /cms/book-appointment to customize online booking
4. **Schedule appointments** - Go to /appointments to manage calendar
5. **Configure settings** - Go to /settings to customize clinic preferences
6. **Set up payments** - Go to /financials to configure invoicing

## Your Personality
- Be warm, helpful, and professional
- Use simple language, avoid jargon
- Give concise answers with actionable steps
- Offer to explain more if needed
- Use emojis sparingly for friendliness
- Always provide direct links/paths to features when relevant

## Context Awareness
You receive the user's onboarding status. Use this to:
- Congratulate completed steps
- Suggest the next logical step
- Provide relevant tips based on their progress

## Response Format
- Keep responses concise (2-4 sentences for simple questions)
- Use bullet points for step-by-step instructions
- Include navigation paths like "Go to **Patients** → Click **Add Patient**"
- End with a helpful follow-up question when appropriate`;

type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

type OnboardingStatus = {
  hasPatients: boolean;
  hasServices: boolean;
  hasBookingPage: boolean;
  hasAppointments: boolean;
  hasSettings: boolean;
  completedSteps: number;
  totalSteps: number;
};

function buildContextMessage(onboardingStatus: OnboardingStatus | null): string {
  if (!onboardingStatus) return "";

  const { hasPatients, hasServices, hasBookingPage, hasAppointments, hasSettings, completedSteps, totalSteps } = onboardingStatus;
  
  let context = `\n\n[CONTEXT - User's Setup Status: ${completedSteps}/${totalSteps} steps completed]\n`;
  
  const steps = [
    { name: "Patients", done: hasPatients, path: "/patients" },
    { name: "Services", done: hasServices, path: "/services" },
    { name: "Booking Page", done: hasBookingPage, path: "/cms/book-appointment" },
    { name: "Appointments", done: hasAppointments, path: "/appointments" },
    { name: "Settings", done: hasSettings, path: "/settings" },
  ];

  steps.forEach(step => {
    context += `- ${step.name}: ${step.done ? "✅ Complete" : "⏳ Not started"}\n`;
  });

  // Suggest next step
  const nextStep = steps.find(s => !s.done);
  if (nextStep) {
    context += `\nNext recommended step: ${nextStep.name} (${nextStep.path})`;
  } else {
    context += `\n🎉 User has completed all onboarding steps!`;
  }

  return context;
}

export async function POST(request: NextRequest) {
  // Parse request body first so we can use it in error handling
  let message = "";
  let onboardingStatus: OnboardingStatus | null = null;
  let conversationHistory: ConversationMessage[] = [];
  
  try {
    const body = await request.json();
    message = body.message || "";
    onboardingStatus = body.onboardingStatus || null;
    conversationHistory = body.conversationHistory || [];
  } catch (parseError) {
    console.error("Failed to parse request body:", parseError);
    return NextResponse.json({
      response: "I'm here to help! What would you like to know about ALiice?"
    });
  }

  if (!message) {
    return NextResponse.json({ 
      response: "I didn't catch that. Could you please rephrase your question?" 
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  // If no API key or invalid, use fallback responses
  if (!apiKey || apiKey === "your-gemini-api-key") {
    console.log("No valid Gemini API key, using fallback response");
    return NextResponse.json({
      response: getFallbackResponse(message, onboardingStatus)
    });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Use stable model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Build conversation history for Gemini
    const historyParts: { role: "user" | "model"; parts: { text: string }[] }[] = [];

    // Add conversation history
    if (conversationHistory && Array.isArray(conversationHistory)) {
      conversationHistory.forEach((msg: ConversationMessage) => {
        historyParts.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }]
        });
      });
    }

    // Create chat with system prompt and history
    const chat = model.startChat({
      history: historyParts,
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.7,
      },
    });

    // Send message with system context
    const fullPrompt = `${SYSTEM_PROMPT}${buildContextMessage(onboardingStatus)}\n\nUser message: ${message}`;
    const result = await chat.sendMessage(fullPrompt);
    const response = result.response.text() || getFallbackResponse(message, onboardingStatus);

    return NextResponse.json({ response });

  } catch (error) {
    console.error("Aliice Assistant Error:", error);
    // Return a fallback response instead of an error to keep the chat working
    return NextResponse.json({
      response: getFallbackResponse(message, onboardingStatus),
      warning: "AI processing encountered an issue, showing fallback response"
    });
  }
}

// Fallback responses when OpenAI is not available
function getFallbackResponse(message: string, onboardingStatus: OnboardingStatus | null): string {
  const lowerMessage = message.toLowerCase();

  // Check for onboarding/getting started queries
  if (lowerMessage.includes("get started") || lowerMessage.includes("onboarding") || lowerMessage.includes("help me")) {
    if (!onboardingStatus?.hasPatients) {
      return "Great! Let's get you started! 🚀\n\nYour first step is to add your patients. Go to **Patients** in the sidebar and click the **+ Add Patient** button.\n\nWould you like me to explain what information to include?";
    }
    if (!onboardingStatus?.hasServices) {
      return "You've added patients - great progress! ✅\n\nNext, let's set up your services. Go to **Services** in the sidebar to define the treatments your clinic offers.\n\nNeed help with pricing or categories?";
    }
    if (!onboardingStatus?.hasBookingPage) {
      return "Excellent progress! Now let's create your online booking page. 🌐\n\nGo to **CMS** → **Book Appointment** to customize your booking page. You'll get a unique link to share with patients.\n\nWant tips on customizing it?";
    }
    return "You're doing great! Most of your setup is complete. Check your **Dashboard** for the onboarding checklist to see what's next.";
  }

  // Patient-related queries
  if (lowerMessage.includes("patient") || lowerMessage.includes("add patient")) {
    return "To add a new patient:\n\n1. Go to **Patients** in the sidebar\n2. Click the **+ Add Patient** button\n3. Fill in their details (name, email, phone)\n4. Click **Save**\n\nYou can also import patients from a CSV file if you have many to add!";
  }

  // Booking page queries
  if (lowerMessage.includes("booking") || lowerMessage.includes("landing page")) {
    return "To set up your booking page:\n\n1. Go to **CMS** → **Book Appointment**\n2. Customize your welcome message and branding\n3. Click **Copy Link** to get your booking URL\n4. Share the link on your website or social media!\n\nPatients can then book appointments directly.";
  }

  // Appointment queries
  if (lowerMessage.includes("appointment") || lowerMessage.includes("schedule") || lowerMessage.includes("calendar")) {
    return "To schedule an appointment:\n\n1. Go to **Calendar** in the sidebar\n2. Click on a time slot\n3. Select the patient and service\n4. Add any notes and save\n\nYou can also let patients book themselves through your online booking page!";
  }

  // Services queries
  if (lowerMessage.includes("service") || lowerMessage.includes("treatment")) {
    return "To set up your services:\n\n1. Go to **Services** in the sidebar\n2. Click **Add Service**\n3. Enter the treatment name, duration, and price\n4. Assign to a category if needed\n\nThese services will appear on your booking page!";
  }

  // Settings queries
  if (lowerMessage.includes("setting") || lowerMessage.includes("configure")) {
    return "To configure your clinic settings:\n\n1. Go to **Settings** in the sidebar\n2. Set up **Doctor Scheduling** for availability\n3. Configure **Calendar Defaults** for appointment durations\n4. Add **Blocked Dates** for holidays\n\nNeed help with a specific setting?";
  }

  // Default response
  return "I'm here to help! You can ask me about:\n\n• **Getting started** with ALiice\n• **Adding patients** and managing records\n• **Setting up services** and pricing\n• **Creating your booking page**\n• **Scheduling appointments**\n• **Configuring settings**\n\nWhat would you like to know more about?";
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    assistant: "Aliice",
    description: "AI assistant for ALiice Medical CRM",
    capabilities: ["onboarding help", "feature guidance", "troubleshooting"]
  });
}
