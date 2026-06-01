"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { supabaseClient } from "@/lib/supabaseClient";
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
  speaker: "doctor" | "patient" | "system";
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
  const [liveText, setLiveText] = useState("");
  const [soapNotes, setSoapNotes] = useState<SOAPNotes | null>(null);
  const [isGeneratingSoap, setIsGeneratingSoap] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript, liveText]);

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

  // Start consultation recording
  const startConsultation = useCallback(async () => {
    try {
      setCallStatus("connecting");
      setError(null);

      // Check for browser support
      if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
        throw new Error("Speech recognition not supported in this browser. Please use Chrome.");
      }

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Set up MediaRecorder for audio backup
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(1000); // Collect in 1-second chunks

      // Set up Speech Recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setLiveText(interimTranscript);

        if (finalTranscript) {
          setTranscript((prev) => [
            ...prev,
            {
              id: `seg-${Date.now()}`,
              speaker: "doctor", // Default to doctor, AI will classify later
              text: finalTranscript.trim(),
              timestamp: new Date(),
            },
          ]);
          setLiveText("");
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === "no-speech") {
          // Restart recognition if no speech detected
          recognition.stop();
          setTimeout(() => recognition.start(), 100);
        }
      };

      recognition.onend = () => {
        // Restart if still active
        if (callStatus === "active" && recognitionRef.current) {
          recognitionRef.current.start();
        }
      };

      recognition.start();
      setCallStatus("active");

      // Add system message
      setTranscript([
        {
          id: "start",
          speaker: "system",
          text: `Consultation started with ${patientName}. Aliice is listening and transcribing...`,
          timestamp: new Date(),
        },
      ]);

    } catch (err) {
      console.error("Error starting consultation:", err);
      setError(err instanceof Error ? err.message : "Failed to start consultation");
      setCallStatus("error");
    }
  }, [patientName, callStatus]);

  // Stop consultation and process
  const stopConsultation = useCallback(async () => {
    try {
      // Stop recording
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }

      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
        mediaRecorderRef.current = null;
      }

      setCallStatus("processing");

      // Add end message
      setTranscript((prev) => [
        ...prev,
        {
          id: "end",
          speaker: "system",
          text: `Consultation ended. Duration: ${formatDuration(duration)}. Processing transcript...`,
          timestamp: new Date(),
        },
      ]);

      // Generate SOAP notes from transcript
      await generateSOAPNotes();

    } catch (err) {
      console.error("Error stopping consultation:", err);
      setError(err instanceof Error ? err.message : "Failed to process consultation");
      setCallStatus("error");
    }
  }, [duration]);

  // Generate SOAP notes using AI
  const generateSOAPNotes = async () => {
    setIsGeneratingSoap(true);
    try {
      const fullTranscript = transcript
        .filter((s) => s.speaker !== "system")
        .map((s) => s.text)
        .join(" ");

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

      let content = `## Consultation Transcript\n\n${fullTranscript}`;

      if (soapNotes) {
        content += `\n\n---\n\n## SOAP Notes\n\n`;
        content += `### Subjective\n${soapNotes.subjective}\n\n`;
        content += `### Objective\n${soapNotes.objective}\n\n`;
        content += `### Assessment\n${soapNotes.assessment}\n\n`;
        content += `### Plan\n${soapNotes.plan}\n\n`;
        
        if (soapNotes.icd10Codes.length > 0) {
          content += `### ICD-10 Codes\n${soapNotes.icd10Codes.join(", ")}\n\n`;
        }
        if (soapNotes.medications.length > 0) {
          content += `### Medications\n${soapNotes.medications.join("\n")}\n\n`;
        }
        if (soapNotes.followUp) {
          content += `### Follow-up\n${soapNotes.followUp}\n`;
        }
      }

      if (onTranscriptSave) {
        onTranscriptSave(content, soapNotes);
      }

      setSaved(true);
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (err) {
      console.error("Error saving consultation:", err);
      setError("Failed to save. Please copy the transcript manually.");
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (mediaRecorderRef.current) {
      const tracks = mediaRecorderRef.current.stream.getAudioTracks();
      tracks.forEach((track) => {
        track.enabled = isMuted;
      });
    }
    setIsMuted(!isMuted);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[90vh] mx-4 flex flex-col rounded-2xl border border-slate-200/80 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur">
              <Stethoscope className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Consult with Aliice</h2>
              <p className="text-sm text-white/80">AI Medical Scribe for {patientName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {callStatus === "active" && (
              <div className="flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5">
                <div className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
                <span className="text-sm font-medium text-white">{formatDuration(duration)}</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Transcript Panel */}
          <div className="flex-1 flex flex-col border-r border-slate-200">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-violet-600" />
                Live Transcript
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
              {transcript.map((segment) => (
                <div
                  key={segment.id}
                  className={`rounded-lg px-3 py-2 text-sm ${
                    segment.speaker === "system"
                      ? "bg-violet-100 text-violet-800 italic"
                      : segment.speaker === "doctor"
                      ? "bg-blue-100 text-blue-900"
                      : "bg-emerald-100 text-emerald-900"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-semibold uppercase opacity-70">
                      {segment.speaker === "system" ? "System" : segment.speaker === "doctor" ? "Doctor" : "Patient"}
                    </span>
                    <span className="text-[10px] opacity-50">
                      {segment.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p>{segment.text}</p>
                </div>
              ))}
              {liveText && (
                <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 animate-pulse">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-semibold uppercase opacity-70">Speaking...</span>
                  </div>
                  <p>{liveText}</p>
                </div>
              )}
              {callStatus === "processing" && (
                <div className="flex items-center justify-center gap-2 py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
                  <span className="text-sm text-slate-600">Processing transcript...</span>
                </div>
              )}
              <div ref={transcriptEndRef} />
            </div>
          </div>

          {/* SOAP Notes Panel */}
          <div className="w-80 flex flex-col bg-white">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <FileText className="h-4 w-4 text-violet-600" />
                SOAP Notes
                {isGeneratingSoap && <Loader2 className="h-3 w-3 animate-spin text-violet-600" />}
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {soapNotes ? (
                <>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase mb-1">Subjective</h4>
                    <p className="text-sm text-slate-700">{soapNotes.subjective || "—"}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase mb-1">Objective</h4>
                    <p className="text-sm text-slate-700">{soapNotes.objective || "—"}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase mb-1">Assessment</h4>
                    <p className="text-sm text-slate-700">{soapNotes.assessment || "—"}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase mb-1">Plan</h4>
                    <p className="text-sm text-slate-700">{soapNotes.plan || "—"}</p>
                  </div>
                  {soapNotes.icd10Codes.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 uppercase mb-1">ICD-10 Codes</h4>
                      <div className="flex flex-wrap gap-1">
                        {soapNotes.icd10Codes.map((code) => (
                          <span key={code} className="px-2 py-0.5 bg-violet-100 text-violet-700 text-xs rounded-full">
                            {code}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {soapNotes.medications.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 uppercase mb-1">Medications</h4>
                      <ul className="text-sm text-slate-700 space-y-1">
                        {soapNotes.medications.map((med, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span className="text-violet-500">•</span>
                            {med}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {soapNotes.followUp && (
                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 uppercase mb-1">Follow-up</h4>
                      <p className="text-sm text-slate-700">{soapNotes.followUp}</p>
                    </div>
                  )}
                </>
              ) : callStatus === "idle" ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <Sparkles className="h-10 w-10 text-violet-300 mb-3" />
                  <p className="text-sm text-slate-500">
                    Start the consultation to see AI-generated SOAP notes appear here in real-time.
                  </p>
                </div>
              ) : callStatus === "active" ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <Loader2 className="h-8 w-8 text-violet-400 animate-spin mb-3" />
                  <p className="text-sm text-slate-500">
                    Listening... SOAP notes will be generated when you end the consultation.
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Footer Controls */}
        <div className="border-t border-slate-200 bg-white px-6 py-4">
          {error && (
            <div className="mb-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {callStatus === "idle" && (
                <button
                  onClick={startConsultation}
                  className="flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-sm font-medium text-white shadow-lg hover:shadow-xl transition-all"
                >
                  <Phone className="h-4 w-4" />
                  Start Consultation
                </button>
              )}
              
              {callStatus === "connecting" && (
                <button
                  disabled
                  className="flex items-center gap-2 rounded-full bg-violet-400 px-6 py-3 text-sm font-medium text-white"
                >
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connecting...
                </button>
              )}
              
              {callStatus === "active" && (
                <>
                  <button
                    onClick={toggleMute}
                    className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
                      isMuted
                        ? "bg-red-100 text-red-600 hover:bg-red-200"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </button>
                  <button
                    onClick={stopConsultation}
                    className="flex items-center gap-2 rounded-full bg-red-600 px-6 py-3 text-sm font-medium text-white hover:bg-red-700 transition-colors"
                  >
                    <PhoneOff className="h-4 w-4" />
                    End Consultation
                  </button>
                </>
              )}
              
              {callStatus === "processing" && (
                <button
                  disabled
                  className="flex items-center gap-2 rounded-full bg-violet-400 px-6 py-3 text-sm font-medium text-white"
                >
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating Notes...
                </button>
              )}
            </div>

            {(callStatus === "complete" || transcript.length > 1) && (
              <div className="flex items-center gap-2">
                <button
                  onClick={copyTranscript}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy Transcript
                    </>
                  )}
                </button>
                <button
                  onClick={saveToConsultation}
                  disabled={saved}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  {saved ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Saved!
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save to Notes
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Web Speech API TypeScript declarations
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}
