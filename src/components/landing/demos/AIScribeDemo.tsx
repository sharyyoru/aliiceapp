"use client";

import { useState, useEffect } from "react";
import { Mic, MicOff, Loader2, CheckCircle2 } from "lucide-react";

type AIScribeDemoProps = {
  expanded?: boolean;
};

const soapNotes = {
  subjective: "Patient presents with mild lower back pain for 2 weeks...",
  objective: "Height 5'10\", Weight 165 lbs, BP 120/80...",
  assessment: "Lumbar strain, likely mechanical origin...",
  plan: "Physical therapy 2x/week, NSAIDs as needed...",
};

const transcriptLines = [
  { speaker: "Doctor", text: "How are you feeling today?", delay: 0 },
  { speaker: "Patient", text: "I've had some back pain for a couple weeks.", delay: 1500 },
  { speaker: "Doctor", text: "Can you describe the pain?", delay: 3000 },
  { speaker: "Patient", text: "It's a dull ache, worse when I sit.", delay: 4500 },
];

export default function AIScribeDemo({ expanded = false }: AIScribeDemoProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [currentLine, setCurrentLine] = useState(0);
  const [showSoap, setShowSoap] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (isRecording && currentLine < transcriptLines.length) {
      const timer = setTimeout(() => {
        setCurrentLine((prev) => prev + 1);
      }, transcriptLines[currentLine].delay + 1500);
      return () => clearTimeout(timer);
    } else if (isRecording && currentLine >= transcriptLines.length) {
      setIsRecording(false);
      setProcessing(true);
      const timer = setTimeout(() => {
        setProcessing(false);
        setShowSoap(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isRecording, currentLine]);

  const startRecording = () => {
    setIsRecording(true);
    setCurrentLine(0);
    setShowSoap(false);
  };

  const resetDemo = () => {
    setIsRecording(false);
    setCurrentLine(0);
    setShowSoap(false);
    setProcessing(false);
  };

  return (
    <div className="space-y-4">
      {/* Recording Button */}
      <div className="flex justify-center">
        <button
          onClick={isRecording ? resetDemo : startRecording}
          disabled={processing}
          className={`relative flex items-center gap-3 px-6 py-3 rounded-full font-medium transition-all ${
            isRecording
              ? "bg-red-100 text-red-600 hover:bg-red-200"
              : processing
              ? "bg-violet-100 text-violet-600"
              : "bg-violet-600 text-white hover:bg-violet-700"
          }`}
        >
          {processing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : isRecording ? (
            <>
              <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
              Recording... Click to stop
            </>
          ) : showSoap ? (
            <>
              <CheckCircle2 className="h-5 w-5" />
              Restart Demo
            </>
          ) : (
            <>
              <Mic className="h-5 w-5" />
              Start Recording
            </>
          )}
        </button>
      </div>

      {/* Transcript or SOAP Notes */}
      {!showSoap ? (
        <div className="bg-slate-50 rounded-xl p-4 min-h-[180px]">
          <div className="text-xs font-medium text-slate-400 mb-3">LIVE TRANSCRIPT</div>
          <div className="space-y-3">
            {transcriptLines.slice(0, currentLine).map((line, idx) => (
              <div
                key={idx}
                className={`animate-fadeIn ${
                  line.speaker === "Doctor" ? "text-sky-700" : "text-slate-700"
                }`}
              >
                <span className="text-xs font-semibold uppercase text-slate-400">
                  {line.speaker}:
                </span>
                <p className="text-sm mt-0.5">{line.text}</p>
              </div>
            ))}
            {isRecording && currentLine < transcriptLines.length && (
              <div className="flex items-center gap-2 text-slate-400">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <span className="text-xs">Listening...</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span className="text-xs font-medium text-emerald-700">SOAP NOTES GENERATED</span>
          </div>
          <div className="space-y-3 text-sm">
            <div>
              <span className="font-semibold text-slate-900">S:</span>
              <span className="text-slate-600 ml-1">{soapNotes.subjective}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-900">O:</span>
              <span className="text-slate-600 ml-1">{soapNotes.objective}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-900">A:</span>
              <span className="text-slate-600 ml-1">{soapNotes.assessment}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-900">P:</span>
              <span className="text-slate-600 ml-1">{soapNotes.plan}</span>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
