"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Download,
  Loader2,
  User,
  Building2,
  DollarSign,
  Calendar,
  Briefcase,
} from "lucide-react";
import jsPDF from "jspdf";

interface OfferLetterData {
  developerName: string;
  company: string;
  directManager: string;
  monthlySalary: number;
  startDate: string;
  jobTitle: string;
  employmentType: string;
  workingHours: string;
  probationPeriod: string;
}

const COMPANY_DETAILS = {
  name: "Aliice Computer Software Trading",
  address: "Arabian Sky Business Center, Um Hurrair Second, Plot 38-0 Office OF09-263",
  city: "Dubai, United Arab Emirates",
  signatories: [
    { name: "Wilson Ali", title: "Chief Executive Officer" },
    { name: "Dr. Xavier Tenorio", title: "Chief Technology Officer" },
  ],
};

const JOB_DESCRIPTION = `
As a Software Developer at Aliice, you will be an integral part of our dynamic development team, working on cutting-edge healthcare technology solutions. Your primary responsibilities include:

• Design, develop, and maintain high-quality web applications using modern technologies including React, Next.js, TypeScript, and Node.js
• Collaborate with cross-functional teams including product managers, designers, and other developers to deliver exceptional user experiences
• Write clean, maintainable, and well-documented code following best practices and coding standards
• Participate in code reviews, providing constructive feedback to team members
• Troubleshoot, debug, and optimize application performance
• Contribute to system architecture decisions and technical documentation
• Stay current with emerging technologies and industry trends
• Work on integrating third-party APIs and services
• Ensure application security and data protection compliance
• Participate in Agile/Scrum ceremonies and contribute to sprint planning

Requirements:
• Proficiency in JavaScript/TypeScript, React, and Node.js
• Experience with database systems (PostgreSQL, Supabase)
• Understanding of RESTful APIs and web services
• Familiarity with version control systems (Git)
• Strong problem-solving and analytical skills
• Excellent communication and teamwork abilities
• Ability to work independently and meet deadlines
`;

export default function OfferLettersPage() {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState<OfferLetterData>({
    developerName: "",
    company: "Aliice",
    directManager: "",
    monthlySalary: 0,
    startDate: "",
    jobTitle: "Software Developer",
    employmentType: "Full-time",
    workingHours: "40 hours per week",
    probationPeriod: "3 months",
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const generatePDF = async () => {
    if (!formData.developerName || !formData.directManager || !formData.monthlySalary || !formData.startDate) {
      alert("Please fill in all required fields");
      return;
    }

    setIsGenerating(true);

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - 2 * margin;
      let yPos = margin;

      // Header with company info
      doc.setFillColor(0, 133, 194); // Sky blue
      doc.rect(0, 0, pageWidth, 35, "F");

      // Company name
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("ALIICE", margin, 18);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(COMPANY_DETAILS.name, margin, 25);
      doc.text(COMPANY_DETAILS.address, margin, 30);

      yPos = 50;

      // Date
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(10);
      doc.text(`Date: ${formatDate(new Date().toISOString())}`, pageWidth - margin - 50, yPos);

      yPos += 15;

      // Title
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("OFFER OF EMPLOYMENT", pageWidth / 2, yPos, { align: "center" });

      yPos += 15;

      // Greeting
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(`Dear ${formData.developerName},`, margin, yPos);

      yPos += 10;

      // Introduction paragraph
      const introParagraph = `We are pleased to extend this offer of employment to you for the position of ${formData.jobTitle} at ${COMPANY_DETAILS.name}. We believe your skills and experience will be a valuable addition to our team.`;
      
      doc.setFontSize(10);
      const introLines = doc.splitTextToSize(introParagraph, contentWidth);
      doc.text(introLines, margin, yPos);
      yPos += introLines.length * 5 + 8;

      // Employment Details Section
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("EMPLOYMENT DETAILS", margin, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      const details = [
        ["Position:", formData.jobTitle],
        ["Employment Type:", formData.employmentType],
        ["Reporting To:", formData.directManager],
        ["Start Date:", formatDate(formData.startDate)],
        ["Working Hours:", formData.workingHours],
        ["Probation Period:", formData.probationPeriod],
      ];

      details.forEach(([label, value]) => {
        doc.setFont("helvetica", "bold");
        doc.text(label, margin, yPos);
        doc.setFont("helvetica", "normal");
        doc.text(value, margin + 45, yPos);
        yPos += 6;
      });

      yPos += 5;

      // Compensation Section
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("COMPENSATION", margin, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Monthly Salary: ${formatCurrency(formData.monthlySalary)}`, margin, yPos);
      yPos += 6;
      doc.text(`Annual Salary: ${formatCurrency(formData.monthlySalary * 12)}`, margin, yPos);
      yPos += 10;

      // Job Description Section
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("JOB DESCRIPTION", margin, yPos);
      yPos += 8;

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      
      const jobDescLines = JOB_DESCRIPTION.trim().split("\n");
      jobDescLines.forEach((line) => {
        if (yPos > pageHeight - 60) {
          doc.addPage();
          yPos = margin;
        }
        const wrappedLines = doc.splitTextToSize(line.trim(), contentWidth);
        wrappedLines.forEach((wrappedLine: string) => {
          doc.text(wrappedLine, margin, yPos);
          yPos += 4.5;
        });
      });

      // Check if we need a new page for signatures
      if (yPos > pageHeight - 80) {
        doc.addPage();
        yPos = margin;
      }

      yPos += 10;

      // Terms paragraph
      const termsParagraph = `This offer is contingent upon successful completion of background verification and reference checks. Please confirm your acceptance by signing below and returning a copy of this letter.`;
      
      doc.setFontSize(10);
      const termsLines = doc.splitTextToSize(termsParagraph, contentWidth);
      doc.text(termsLines, margin, yPos);
      yPos += termsLines.length * 5 + 10;

      // Closing
      doc.text("We look forward to welcoming you to the Aliice team!", margin, yPos);
      yPos += 15;
      doc.text("Sincerely,", margin, yPos);
      yPos += 20;

      // Signatures section
      const signatureWidth = (contentWidth - 20) / 3;
      
      // Signatory 1
      doc.setFont("helvetica", "bold");
      doc.text("_______________________", margin, yPos);
      yPos += 5;
      doc.setFontSize(9);
      doc.text(COMPANY_DETAILS.signatories[0].name, margin, yPos);
      yPos += 4;
      doc.setFont("helvetica", "normal");
      doc.text(COMPANY_DETAILS.signatories[0].title, margin, yPos);
      
      // Signatory 2
      yPos -= 9;
      doc.setFont("helvetica", "bold");
      doc.text("_______________________", margin + signatureWidth + 10, yPos);
      yPos += 5;
      doc.setFontSize(9);
      doc.text(COMPANY_DETAILS.signatories[1].name, margin + signatureWidth + 10, yPos);
      yPos += 4;
      doc.setFont("helvetica", "normal");
      doc.text(COMPANY_DETAILS.signatories[1].title, margin + signatureWidth + 10, yPos);

      yPos += 20;

      // Employee acceptance section
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("EMPLOYEE ACCEPTANCE", margin, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("I accept the offer of employment as outlined above.", margin, yPos);
      yPos += 15;

      doc.setFont("helvetica", "bold");
      doc.text("_______________________", margin, yPos);
      doc.text("_______________________", margin + signatureWidth + 40, yPos);
      yPos += 5;
      doc.setFontSize(9);
      doc.text(formData.developerName, margin, yPos);
      doc.text("Date", margin + signatureWidth + 40, yPos);
      yPos += 4;
      doc.setFont("helvetica", "normal");
      doc.text("Employee Signature", margin, yPos);

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        "This document is confidential and intended solely for the named recipient.",
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
      );

      // Save the PDF
      const fileName = `Offer_Letter_${formData.developerName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(fileName);

    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Image src="/logos/aliice-logo.png" alt="Aliice Logo" width={100} height={32} />
            <span className="text-slate-300">|</span>
            <span className="text-sm font-medium text-sky-600 bg-sky-50 px-2 py-1 rounded">
              Offer Letter Generator
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-sky-100 rounded-xl">
              <FileText className="w-6 h-6 text-sky-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Developer Offer Letter</h1>
              <p className="text-sm text-slate-500">Generate professional offer letters for developers joining Aliice clients</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Developer Name */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <User className="w-4 h-4" />
                Developer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.developerName}
                onChange={(e) => setFormData({ ...formData, developerName: e.target.value })}
                placeholder="John Smith"
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            {/* Company */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <Building2 className="w-4 h-4" />
                Company
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none bg-slate-50"
                disabled
              />
            </div>

            {/* Job Title */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <Briefcase className="w-4 h-4" />
                Job Title
              </label>
              <select
                value={formData.jobTitle}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="Software Developer">Software Developer</option>
                <option value="Senior Software Developer">Senior Software Developer</option>
                <option value="Full Stack Developer">Full Stack Developer</option>
                <option value="Frontend Developer">Frontend Developer</option>
                <option value="Backend Developer">Backend Developer</option>
                <option value="Mobile Developer">Mobile Developer</option>
                <option value="DevOps Engineer">DevOps Engineer</option>
                <option value="QA Engineer">QA Engineer</option>
                <option value="Technical Lead">Technical Lead</option>
              </select>
            </div>

            {/* Direct Manager */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <User className="w-4 h-4" />
                Direct Manager <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.directManager}
                onChange={(e) => setFormData({ ...formData, directManager: e.target.value })}
                placeholder="Manager Name"
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            {/* Monthly Salary */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <DollarSign className="w-4 h-4" />
                Monthly Salary (AED) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.monthlySalary || ""}
                onChange={(e) => setFormData({ ...formData, monthlySalary: parseFloat(e.target.value) || 0 })}
                placeholder="15000"
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            {/* Start Date */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <Calendar className="w-4 h-4" />
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            {/* Employment Type */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Employment Type</label>
              <select
                value={formData.employmentType}
                onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Freelance">Freelance</option>
              </select>
            </div>

            {/* Probation Period */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Probation Period</label>
              <select
                value={formData.probationPeriod}
                onChange={(e) => setFormData({ ...formData, probationPeriod: e.target.value })}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="1 month">1 month</option>
                <option value="2 months">2 months</option>
                <option value="3 months">3 months</option>
                <option value="6 months">6 months</option>
                <option value="None">None</option>
              </select>
            </div>
          </div>

          {/* Salary Preview */}
          {formData.monthlySalary > 0 && (
            <div className="mt-6 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <h3 className="text-sm font-medium text-emerald-800 mb-2">Compensation Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-emerald-600">Monthly:</span>
                  <span className="font-bold text-emerald-800 ml-2">{formatCurrency(formData.monthlySalary)}</span>
                </div>
                <div>
                  <span className="text-emerald-600">Annual:</span>
                  <span className="font-bold text-emerald-800 ml-2">{formatCurrency(formData.monthlySalary * 12)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={generatePDF}
              disabled={isGenerating || !formData.developerName || !formData.directManager || !formData.monthlySalary || !formData.startDate}
              className="flex items-center gap-2 px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Generate & Download PDF
                </>
              )}
            </button>
          </div>
        </div>

        {/* Job Description Preview */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Job Description Preview</h2>
          <div className="prose prose-sm max-w-none text-slate-600">
            <pre className="whitespace-pre-wrap font-sans text-sm bg-slate-50 p-4 rounded-lg">
              {JOB_DESCRIPTION.trim()}
            </pre>
          </div>
        </div>

        {/* Company Info */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Company Information</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500">Company Name</p>
              <p className="font-medium text-slate-900">{COMPANY_DETAILS.name}</p>
            </div>
            <div>
              <p className="text-slate-500">Address</p>
              <p className="font-medium text-slate-900">{COMPANY_DETAILS.address}</p>
            </div>
            <div>
              <p className="text-slate-500">Location</p>
              <p className="font-medium text-slate-900">{COMPANY_DETAILS.city}</p>
            </div>
            <div>
              <p className="text-slate-500">Signatories</p>
              <p className="font-medium text-slate-900">
                {COMPANY_DETAILS.signatories.map((s) => s.name).join(", ")}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
