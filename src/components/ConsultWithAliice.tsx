"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  X,
  Sparkles,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Save,
  Stethoscope,
  Clock,
  User,
  ClipboardList,
} from "lucide-react";

type ConsultWithAliiceProps = {
  patientId: string;
  patientName: string;
  consultationId?: string;
  onTranscriptSave?: (content: string, soapNotes: SOAPNotes | null) => void;
  onClose: () => void;
};

type TranscriptSegment = {
  id: string;
  speaker: "agent" | "user" | "system";
  text: string;
  timestamp: Date;
};

type SOAPNotes = {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  icd10Codes: string[];
  medications: string[];
  followUp: string;
};

type CallStatus = "idle" | "connecting" | "active" | "processing" | "complete" | "error";

export default function ConsultWithAliice({
  patientId,
  patientName,
  consultationId,
  onTranscriptSave,
  onClose,
}: ConsultWithAliiceProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [soapNotes, setSoapNotes] = useState<SOAPNotes | null>(null);
  const [isGeneratingSoap, setIsGeneratingSoap] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"transcript" | "soap">("transcript");
  
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const retellClientRef = useRef<any>(null);
  const callIdRef = useRef<string | null>(null);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  // Duration timer
  useEffect(() => {
    if (callStatus === "active") {
      durationIntervalRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    }
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [callStatus]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Start consultation with Retell AI
  const startConsultation = useCallback(async () => {
    try {
      setCallStatus("connecting");
      setError(null);

      // Add system message
      setTranscript([
        {
          id: "start",
          speaker: "system",
          text: `Connecting to Aliice AI Medical Scribe for ${patientName}...`,
          timestamp: new Date(),
        },
      ]);

      // Create consultation call via our API
      const response = await fetch("/api/retell/create-consultation-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, patientName }),
      });

      if (!response.ok) {
        throw new Error("Failed to create consultation call");
      }

      const { access_token, call_id } = await response.json();
      callIdRef.current = call_id;

      // Dynamically import Retell Web SDK
      const { RetellWebClient } = await import("retell-client-js-sdk");
      const retellClient = new RetellWebClient();
      retellClientRef.current = retellClient;

      // Set up event listeners
      retellClient.on("call_started", () => {
        setCallStatus("active");
        setTranscript((prev) => [
          ...prev,
          {
            id: `system-${Date.now()}`,
            speaker: "system",
            text: `Consultation started. Aliice is ready to assist with ${patientName}'s consultation.`,
            timestamp: new Date(),
          },
        ]);
      });

      retellClient.on("call_ended", () => {
        handleCallEnd();
      });

      retellClient.on("agent_start_talking", () => {
        // Agent started speaking
      });

      retellClient.on("agent_stop_talking", () => {
        // Agent stopped speaking
      });

      retellClient.on("update", (update: any) => {
        console.log("Retell update:", update);
        
        // Handle transcript updates - Retell sends updates in different formats
        if (update.transcript) {
          const segments = update.transcript;
          if (Array.isArray(segments)) {
            const newTranscript: TranscriptSegment[] = segments.map((seg: any, idx: number) => ({
              id: `seg-${idx}`,
              speaker: seg.role === "agent" ? "agent" : "user",
              text: seg.content,
              timestamp: new Date(),
            }));
            setTranscript((prev) => {
              const systemMsgs = prev.filter((s) => s.speaker === "system");
              return [...systemMsgs, ...newTranscript];
            });
          }
        }
        
        // Handle live transcription updates
        if (update.turntaking) {
          const role = update.turntaking.role;
          const content = update.turntaking.content;
          if (content) {
            setTranscript((prev) => {
              const lastNonSystem = [...prev].reverse().find(s => s.speaker !== "system");
              if (lastNonSystem && lastNonSystem.speaker === (role === "agent" ? "agent" : "user")) {
                // Update last segment
                return prev.map(s => 
                  s.id === lastNonSystem.id 
                    ? { ...s, text: content } 
                    : s
                );
              } else {
                // Add new segment
                return [...prev, {
                  id: `live-${Date.now()}`,
                  speaker: role === "agent" ? "agent" : "user",
                  text: content,
                  timestamp: new Date(),
                }];
              }
            });
          }
        }
      });

      retellClient.on("error", (error: any) => {
        console.error("Retell error:", error);
        setError("Connection error. Please try again.");
        setCallStatus("error");
      });

      // Start the call
      await retellClient.startCall({
        accessToken: access_token,
        sampleRate: 24000,
        captureDeviceId: "default",
        playbackDeviceId: "default",
      });

    } catch (err) {
      console.error("Error starting consultation:", err);
      setError(err instanceof Error ? err.message : "Failed to start consultation");
      setCallStatus("error");
    }
  }, [patientId, patientName]);

  // Fetch final transcript from Retell API
  const fetchFinalTranscript = async (callId: string) => {
    try {
      const response = await fetch(`/api/retell/get-call-transcript?callId=${callId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.transcript && Array.isArray(data.transcript)) {
          const fetchedTranscript: TranscriptSegment[] = data.transcript.map((seg: any, idx: number) => ({
            id: `final-${idx}`,
            speaker: seg.role === "agent" ? "agent" : "user",
            text: seg.content,
            timestamp: new Date(),
          }));
          setTranscript((prev) => {
            const systemMsgs = prev.filter((s) => s.speaker === "system");
            return [...systemMsgs, ...fetchedTranscript];
          });
          return fetchedTranscript;
        }
      }
    } catch (err) {
      console.error("Error fetching final transcript:", err);
    }
    return null;
  };

  // Handle call end
  const handleCallEnd = useCallback(async () => {
    setCallStatus("processing");

    setTranscript((prev) => [
      ...prev,
      {
        id: "end",
        speaker: "system",
        text: `Consultation ended. Duration: ${formatDuration(duration)}. Processing transcript...`,
        timestamp: new Date(),
      },
    ]);

    // Try to fetch final transcript from Retell API
    if (callIdRef.current) {
      await fetchFinalTranscript(callIdRef.current);
    }

    // Generate SOAP notes
    // Use timeout to ensure state is updated
    setTimeout(async () => {
      const hasContent = transcript.filter((s) => s.speaker !== "system").length > 0;
      if (hasContent) {
        await generateSOAPNotes();
      } else {
        setCallStatus("complete");
      }
    }, 500);
  }, [duration, transcript]);

  // Stop consultation
  const stopConsultation = useCallback(async () => {
    try {
      if (retellClientRef.current) {
        retellClientRef.current.stopCall();
        retellClientRef.current = null;
      }
    } catch (err) {
      console.error("Error stopping consultation:", err);
    }
    handleCallEnd();
  }, [handleCallEnd]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (retellClientRef.current) {
      if (isMuted) {
        retellClientRef.current.unmute();
      } else {
        retellClientRef.current.mute();
      }
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  // Generate SOAP notes using AI
  const generateSOAPNotes = async () => {
    setIsGeneratingSoap(true);
    try {
      const fullTranscript = transcript
        .filter((s) => s.speaker !== "system")
        .map((s) => `[${s.speaker.toUpperCase()}]: ${s.text}`)
        .join("\n");

      if (!fullTranscript.trim()) {
        setCallStatus("complete");
        return;
      }

      const response = await fetch("/api/consultations/generate-soap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: fullTranscript,
          patientId,
          patientName,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate SOAP notes");
      }

      const data = await response.json();
      setSoapNotes(data.soapNotes);
      setActiveTab("soap");
      setCallStatus("complete");

    } catch (err) {
      console.error("Error generating SOAP notes:", err);
      setError("Failed to generate notes. You can still copy the transcript.");
      setCallStatus("complete");
    } finally {
      setIsGeneratingSoap(false);
    }
  };

  // Copy transcript to clipboard
  const copyTranscript = () => {
    const text = transcript
      .map((s) => `[${s.speaker.toUpperCase()}] ${s.text}`)
      .join("\n\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Save to consultation
  const saveToConsultation = async () => {
    try {
      const fullTranscript = transcript
        .filter((s) => s.speaker !== "system")
        .map((s) => `[${s.speaker.toUpperCase()}] ${s.text}`)
        .join("\n\n");

      if (onTranscriptSave) {
        onTranscriptSave(fullTranscript, soapNotes);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Error saving consultation:", err);
      setError("Failed to save consultation");
    }
  };

  // Handle close
  const handleClose = () => {
    if (retellClientRef.current) {
      retellClientRef.current.stopCall();
    }
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    setIsOpen(false);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-4xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur">
                <Stethoscope className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Consult with Aliice</h2>
                <p className="text-sm text-white/80">AI Medical Scribe for {patientName}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex h-[500px]">
          {/* Left Panel - Transcript */}
          <div className="flex-1 flex flex-col border-r border-slate-200">
            {/* Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50">
              <button
                onClick={() => setActiveTab("transcript")}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === "transcript"
                    ? "text-violet-600 border-b-2 border-violet-600 bg-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <FileText className="h-4 w-4" />
                  Live Transcript
                </div>
              </button>
              <button
                onClick={() => setActiveTab("soap")}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === "soap"
                    ? "text-violet-600 border-b-2 border-violet-600 bg-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <ClipboardList className="h-4 w-4" />
                  SOAP Notes
                </div>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === "transcript" ? (
                <div className="space-y-3">
                  {transcript.map((segment) => (
                    <div
                      key={segment.id}
                      className={`rounded-lg p-3 ${
                        segment.speaker === "system"
                          ? "bg-violet-50 border border-violet-100"
                          : segment.speaker === "agent"
                          ? "bg-emerald-50 border border-emerald-100"
                          : "bg-slate-100 border border-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-xs font-semibold uppercase ${
                            segment.speaker === "system"
                              ? "text-violet-600"
                              : segment.speaker === "agent"
                              ? "text-emerald-600"
                              : "text-slate-600"
                          }`}
                        >
                          {segment.speaker === "agent" ? "Aliice" : segment.speaker === "user" ? "Doctor" : "System"}
                        </span>
                        <span className="text-xs text-slate-400">
                          {segment.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700">{segment.text}</p>
                    </div>
                  ))}
                  {isGeneratingSoap && (
                    <div className="flex items-center gap-2 text-sm text-violet-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating SOAP notes...
                    </div>
                  )}
                  <div ref={transcriptEndRef} />
                </div>
              ) : (
                <div className="space-y-4">
                  {soapNotes ? (
                    <>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 mb-1">Subjective</h4>
                        <p className="text-sm text-slate-600">{soapNotes.subjective}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 mb-1">Objective</h4>
                        <p className="text-sm text-slate-600">{soapNotes.objective}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 mb-1">Assessment</h4>
                        <p className="text-sm text-slate-600">{soapNotes.assessment}</p>
                        {soapNotes.icd10Codes.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {soapNotes.icd10Codes.map((code, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                                {code}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 mb-1">Plan</h4>
                        <p className="text-sm text-slate-600">{soapNotes.plan}</p>
                        {soapNotes.medications.length > 0 && (
                          <div className="mt-2">
                            <span className="text-xs font-medium text-slate-500">Medications:</span>
                            <ul className="mt-1 text-sm text-slate-600">
                              {soapNotes.medications.map((med, idx) => (
                                <li key={idx}>• {med}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {soapNotes.followUp && (
                          <p className="mt-2 text-sm text-slate-600">
                            <span className="font-medium">Follow-up:</span> {soapNotes.followUp}
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                      <ClipboardList className="h-12 w-12 mb-2" />
                      <p className="text-sm">SOAP notes will appear after the consultation</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Controls */}
          <div className="w-64 bg-slate-50 p-4 flex flex-col">
            {/* Duration */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 text-slate-500 mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-xs font-medium">Duration</span>
              </div>
              <p className="text-3xl font-mono font-bold text-slate-900">
                {formatDuration(duration)}
              </p>
            </div>

            {/* Status */}
            <div className="text-center mb-6">
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                callStatus === "idle" ? "bg-slate-200 text-slate-600" :
                callStatus === "connecting" ? "bg-amber-100 text-amber-700" :
                callStatus === "active" ? "bg-emerald-100 text-emerald-700" :
                callStatus === "processing" ? "bg-violet-100 text-violet-700" :
                callStatus === "complete" ? "bg-blue-100 text-blue-700" :
                "bg-red-100 text-red-700"
              }`}>
                {callStatus === "connecting" && <Loader2 className="h-3 w-3 animate-spin" />}
                {callStatus === "active" && <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />}
                {callStatus === "complete" && <CheckCircle2 className="h-3 w-3" />}
                {callStatus === "error" && <AlertCircle className="h-3 w-3" />}
                {callStatus === "idle" ? "Ready" :
                 callStatus === "connecting" ? "Connecting..." :
                 callStatus === "active" ? "Recording" :
                 callStatus === "processing" ? "Processing..." :
                 callStatus === "complete" ? "Complete" : "Error"}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
                {error}
              </div>
            )}

            {/* Call Controls */}
            <div className="flex-1 flex flex-col justify-center gap-3">
              {callStatus === "idle" && (
                <button
                  onClick={startConsultation}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-medium hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg"
                >
                  <Phone className="h-5 w-5" />
                  Start Consultation
                </button>
              )}

              {callStatus === "active" && (
                <>
                  <button
                    onClick={toggleMute}
                    className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-medium transition-all ${
                      isMuted
                        ? "bg-red-100 text-red-600 hover:bg-red-200"
                        : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                    }`}
                  >
                    {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    {isMuted ? "Unmute" : "Mute"}
                  </button>
                  <button
                    onClick={stopConsultation}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-all"
                  >
                    <PhoneOff className="h-5 w-5" />
                    End Consultation
                  </button>
                </>
              )}

              {(callStatus === "complete" || callStatus === "error") && (
                <>
                  <button
                    onClick={copyTranscript}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-300 transition-all"
                  >
                    {copied ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <Copy className="h-5 w-5" />}
                    {copied ? "Copied!" : "Copy Transcript"}
                  </button>
                  <button
                    onClick={saveToConsultation}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-all"
                  >
                    {saved ? <CheckCircle2 className="h-5 w-5" /> : <Save className="h-5 w-5" />}
                    {saved ? "Saved!" : "Save to Notes"}
                  </button>
                </>
              )}
            </div>

            {/* Patient Info */}
            <div className="mt-4 p-3 bg-white rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <User className="h-4 w-4" />
                <span className="text-xs font-medium">Patient</span>
              </div>
              <p className="text-sm font-medium text-slate-900">{patientName}</p>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
