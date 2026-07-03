"use client";

import Image from "next/image";
import { Download, ExternalLink } from "lucide-react";

interface Props {
  dataUrl: string;
  svgString: string;
  targetUrl: string;
}

export default function QRDownloadClient({ dataUrl, svgString, targetUrl }: Props) {
  function downloadPng() {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "aliice-qr-code.png";
    a.click();
  }

  function downloadSvg() {
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "aliice-qr-code.svg";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-sky-50 flex flex-col items-center justify-center px-4 py-16">
      {/* Card */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-10 flex flex-col items-center gap-6 max-w-sm w-full">
        {/* Logo */}
        <div className="flex flex-col items-center gap-1 mb-2">
          <span className="text-2xl font-bold tracking-tight text-slate-900">aliice</span>
          <span className="text-xs text-slate-400 tracking-widest uppercase">Clinic Management</span>
        </div>

        {/* QR code */}
        <div className="rounded-2xl overflow-hidden border-4 border-slate-900 shadow-lg">
          <Image
            src={dataUrl}
            alt="QR code for aliice.app"
            width={260}
            height={260}
            unoptimized
            priority
          />
        </div>

        {/* URL label */}
        <a
          href={targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm font-medium text-sky-600 hover:text-sky-700 transition"
        >
          {targetUrl}
          <ExternalLink className="w-3.5 h-3.5" />
        </a>

        {/* Download buttons */}
        <div className="flex gap-3 w-full">
          <button
            onClick={downloadPng}
            className="flex-1 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl py-3 transition-colors"
          >
            <Download className="w-4 h-4" />
            PNG
          </button>
          <button
            onClick={downloadSvg}
            className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold rounded-xl py-3 border border-slate-200 transition-colors"
          >
            <Download className="w-4 h-4" />
            SVG
          </button>
        </div>

        <p className="text-xs text-slate-400 text-center">
          Scan to visit aliice.app · High-resolution export ready for print
        </p>
      </div>
    </div>
  );
}
