"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { createPortal } from "react-dom";
import { supabaseClient } from "@/lib/supabaseClient";
import { 
  MessageCircle, 
  X, 
  Send, 
  Phone, 
  PhoneOff,
  Mic,
  MicOff,
  Sparkles,
  ChevronDown,
  CheckCircle2,
  Circle,
  Loader2,
  HelpCircle,
  BookOpen,
  Zap
} from "lucide-react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
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

const QUICK_ACTIONS = [
  { id: "onboarding", label: "Help me get started", icon: <Zap className="h-4 w-4" /> },
  { id: "patients", label: "How do I add patients?", icon: <HelpCircle className="h-4 w-4" /> },
  { id: "booking", label: "Set up my booking page", icon: <BookOpen className="h-4 w-4" /> },
  { id: "appointments", label: "Schedule appointments", icon: <HelpCircle className="h-4 w-4" /> },
];

export default function TalkToAliice() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOnCall, setIsOnCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      checkOnboardingStatus();
      // Add welcome message
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: "Hi! I'm Aliice, your AI assistant. I can help you set up your clinic, answer questions about the system, or guide you through any feature. How can I help you today?",
        timestamp: new Date()
      }]);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function checkOnboardingStatus() {
    try {
      const [patients, services, appointments, settings] = await Promise.all([
        supabaseClient.from("patients").select("*", { count: "exact", head: true }),
        supabaseClient.from("services").select("*", { count: "exact", head: true }),
        supabaseClient.from("appointments").select("*", { count: "exact", head: true }),
        supabaseClient.from("doctor_scheduling_settings").select("*", { count: "exact", head: true }),
      ]);

      // Check booking page
      let hasBookingPage = false;
      try {
        const res = await fetch("/api/settings/content-translations");
        const data = await res.json();
        hasBookingPage = !!data?.bookingPages || !!data?.pageConfig;
      } catch {}

      const status: OnboardingStatus = {
        hasPatients: (patients.count || 0) > 0,
        hasServices: (services.count || 0) > 0,
        hasBookingPage,
        hasAppointments: (appointments.count || 0) > 0,
        hasSettings: (settings.count || 0) > 0,
        completedSteps: 0,
        totalSteps: 5
      };

      status.completedSteps = [
        status.hasPatients,
        status.hasServices,
        status.hasBookingPage,
        status.hasAppointments,
        status.hasSettings
      ].filter(Boolean).length;

      setOnboardingStatus(status);
    } catch (error) {
      console.error("Error checking onboarding status:", error);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setShowQuickActions(false);

    try {
      const response = await fetch("/api/chat/aliice-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          onboardingStatus,
          conversationHistory: messages.slice(-10).map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.response || "I apologize, but I encountered an issue. Please try again.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  }

  function handleQuickAction(actionId: string) {
    const action = QUICK_ACTIONS.find(a => a.id === actionId);
    if (action) {
      setInput(action.label);
      setShowQuickActions(false);
      // Auto-submit
      const fakeEvent = { preventDefault: () => {} } as FormEvent;
      setTimeout(() => {
        setInput(action.label);
        handleSubmit(fakeEvent);
      }, 100);
    }
  }

  async function startVoiceCall() {
    try {
      setMessages(prev => [...prev, {
        id: `system-${Date.now()}`,
        role: "assistant",
        content: "🔄 Connecting to voice assistant...",
        timestamp: new Date()
      }]);

      // Get access token from our API
      const response = await fetch("/api/retell/create-web-call", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to create call");
      }

      const { access_token } = await response.json();

      // Dynamically import Retell Web SDK
      const { RetellWebClient } = await import("retell-client-js-sdk");
      const retellClient = new RetellWebClient();

      // Start the call
      await retellClient.startCall({
        accessToken: access_token,
        sampleRate: 24000,
        captureDeviceId: "default",
        playbackDeviceId: "default",
      });

      setIsOnCall(true);
      setMessages(prev => [...prev, {
        id: `system-${Date.now()}`,
        role: "assistant",
        content: "🎤 Voice call connected! You can now speak to Aliice directly. Click the red phone button to end the call.",
        timestamp: new Date()
      }]);

      // Store client reference for ending call
      (window as unknown as { retellClient: typeof retellClient }).retellClient = retellClient;

      // Listen for call end
      retellClient.on("call_ended", () => {
        setIsOnCall(false);
        setIsMuted(false);
        setMessages(prev => [...prev, {
          id: `system-${Date.now()}`,
          role: "assistant",
          content: "📞 Voice call ended. You can continue chatting or start a new call anytime.",
          timestamp: new Date()
        }]);
      });

    } catch (error) {
      console.error("Error starting voice call:", error);
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "❌ Sorry, I couldn't connect the voice call. Please try again or use the chat instead.",
        timestamp: new Date()
      }]);
    }
  }

  function endVoiceCall() {
    try {
      const retellClient = (window as unknown as { retellClient?: { stopCall: () => void } }).retellClient;
      if (retellClient) {
        retellClient.stopCall();
      }
    } catch (error) {
      console.error("Error ending call:", error);
    }
    setIsOnCall(false);
    setIsMuted(false);
    setMessages(prev => [...prev, {
      id: `system-${Date.now()}`,
      role: "assistant",
      content: "📞 Voice call ended. You can continue chatting or start a new call anytime.",
      timestamp: new Date()
    }]);
  }

  if (!mounted) return null;

  return createPortal(
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:scale-105 ${
          isOpen 
            ? "bg-slate-900 text-white rotate-0" 
            : "bg-gradient-to-br from-sky-500 to-indigo-600 text-white animate-pulse hover:animate-none"
        }`}
        aria-label={isOpen ? "Close Aliice" : "Talk to Aliice"}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <div className="relative">
            <MessageCircle className="h-6 w-6" />
            <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-yellow-300" />
          </div>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] max-h-[600px] flex flex-col rounded-2xl border border-slate-200/80 bg-white shadow-[0_25px_60px_rgba(15,23,42,0.25)] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-sky-500 to-indigo-600 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Talk to Aliice</h3>
                <p className="text-xs text-white/80">Your AI Assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isOnCall ? (
                <>
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                      isMuted ? "bg-red-500 text-white" : "bg-white/20 text-white hover:bg-white/30"
                    }`}
                  >
                    {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={endVoiceCall}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
                  >
                    <PhoneOff className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={startVoiceCall}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
                  title="Start voice call"
                >
                  <Phone className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Onboarding Progress (if incomplete) */}
          {onboardingStatus && onboardingStatus.completedSteps < onboardingStatus.totalSteps && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-2 border-b border-amber-100">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-amber-800">Setup Progress</span>
                <span className="text-amber-600">{onboardingStatus.completedSteps}/{onboardingStatus.totalSteps} completed</span>
              </div>
              <div className="mt-1 h-1.5 w-full rounded-full bg-amber-200 overflow-hidden">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
                  style={{ width: `${(onboardingStatus.completedSteps / onboardingStatus.totalSteps) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[400px] bg-slate-50/50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    message.role === "user"
                      ? "bg-gradient-to-br from-sky-500 to-indigo-600 text-white rounded-br-md"
                      : "bg-white border border-slate-200 text-slate-800 rounded-bl-md shadow-sm"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-2.5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-sky-500" />
                    <span className="text-sm text-slate-500">Aliice is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {showQuickActions && messages.length <= 1 && (
            <div className="px-4 py-2 border-t border-slate-100 bg-white">
              <p className="text-xs text-slate-500 mb-2">Quick actions:</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleQuickAction(action.id)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-sky-100 hover:text-sky-700 transition-colors"
                  >
                    {action.icon}
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-white p-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Aliice anything..."
                disabled={loading || isOnCall}
                className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim() || isOnCall}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>,
    document.body
  );
}
