"use client";

import { useState } from "react";
import { submitReport } from "@/lib/api-service";

const ISSUE_TYPES = [
  {
    value: "missing_item",
    label: "Missing items in my order",
    description: "One or more items I ordered were not included",
  },
  {
    value: "damaged_item",
    label: "Item arrived damaged or defective",
    description: "The item was broken, crushed, or spoiled on arrival",
  },
  {
    value: "wrong_item",
    label: "Wrong item was delivered",
    description: "I received a different item than what I ordered",
  },
  {
    value: "late_delivery",
    label: "Order never arrived or very late",
    description: "My delivery was significantly delayed or never showed up",
  },
  {
    value: "poor_quality",
    label: "Item quality was poor",
    description: "The item was not fresh or below the expected quality",
  },
  {
    value: "other",
    label: "Other issue",
    description: "Something else went wrong with my order",
  },
] as const;

interface ReportModalProps {
  open: boolean;
  orderId: number;
  onClose: () => void;
}

export default function ReportModal({ open, orderId, onClose }: ReportModalProps) {
  const [selectedType, setSelectedType] = useState<string>("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleClose = () => {
    setSelectedType("");
    setDescription("");
    setSubmitting(false);
    setSubmitted(false);
    setError("");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) { setError("Please select an issue type."); return; }
    if (!description.trim()) { setError("Please describe the issue."); return; }

    setSubmitting(true);
    setError("");
    try {
      await submitReport(orderId, selectedType, description.trim());
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-forest/30 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={handleClose}
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-md bg-cream z-50 shadow-2xl transition-transform duration-300 ease-in-out flex flex-col ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-forest/10 shrink-0">
          <div>
            <p className="text-sage text-xs font-medium tracking-widest uppercase mb-1">
              Order #{orderId}
            </p>
            <h2 className="font-playfair text-2xl text-forest">Report a Problem</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl hover:bg-forest/5 transition-colors text-forest/40 hover:text-forest"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {submitted ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-sage/20 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8 text-sage">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-playfair text-xl text-forest">Report Submitted</h3>
              <p className="text-sm text-[#777] font-light max-w-xs">
                Thank you for letting us know. Our team will review your report and be in touch shortly.
              </p>
              <button
                onClick={handleClose}
                className="mt-4 bg-forest text-cream text-sm font-medium px-6 py-2.5 rounded-xl hover:bg-sage transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <p className="text-sm text-[#777]">
                What went wrong with your order? We'll look into it right away.
              </p>

              {/* Issue type — Amazon-style radio list */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-forest/60 uppercase tracking-widest">
                  Select issue type
                </label>
                <div className="flex flex-col gap-2">
                  {ISSUE_TYPES.map((type) => (
                    <label
                      key={type.value}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                        selectedType === type.value
                          ? "bg-sage/10 border-sage/40"
                          : "bg-white border-forest/10 hover:border-sage/30 hover:bg-sage/5"
                      }`}
                    >
                      <input
                        type="radio"
                        name="report_type"
                        value={type.value}
                        checked={selectedType === type.value}
                        onChange={() => setSelectedType(type.value)}
                        className="mt-0.5 accent-sage shrink-0"
                      />
                      <div>
                        <p className={`text-sm font-medium ${selectedType === type.value ? "text-forest" : "text-forest/80"}`}>
                          {type.label}
                        </p>
                        <p className="text-xs text-[#999] mt-0.5">{type.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-forest/60 uppercase tracking-widest">
                  Additional details
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please describe what happened in more detail..."
                  rows={4}
                  className="w-full rounded-xl border-[1.5px] border-sage/40 focus:border-sage focus:ring-2 focus:ring-sage/10 outline-none bg-white px-4 py-3 text-sm text-forest resize-none"
                />
              </div>

              {error && (
                <p className="text-sm text-[#b94040] bg-clay/10 border border-clay/20 rounded-xl px-4 py-3">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-forest text-cream text-sm font-medium py-3 rounded-xl hover:bg-sage shadow-lg shadow-forest/10 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {submitting ? "Submitting..." : "Submit Report"}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
