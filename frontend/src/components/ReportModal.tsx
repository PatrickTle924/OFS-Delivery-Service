"use client";

import { useState } from "react";

const REPORT_TYPES = [
  { value: "damaged_item", label: "Damaged Item" },
  { value: "missing_item", label: "Missing Item" },
  { value: "wrong_item", label: "Wrong Item Delivered" },
  { value: "late_delivery", label: "Late Delivery" },
  { value: "other", label: "Other" },
];

interface ReportModalProps {
  open: boolean;
  orderId: number;
  customerId: number;
  onClose: () => void;
}

export default function ReportModal({
  open,
  orderId,
  customerId,
  onClose,
}: ReportModalProps) {
  const [reportType, setReportType] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleClose = () => {
    setReportType("");
    setDescription("");
    setSubmitting(false);
    setSubmitted(false);
    setError("");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportType || !description.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("http://localhost:5000/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          customer_id: customerId,
          report_type: reportType,
          description: description.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit report");
      }

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

      {/* Drawer panel */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-md bg-cream z-50 shadow-2xl transition-transform duration-300 ease-in-out flex flex-col ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-forest/10">
          <div>
            <p className="text-xs font-medium text-sage uppercase tracking-widest mb-1">
              Order #{orderId}
            </p>
            <h2 className="font-playfair text-2xl text-forest">Report an Issue</h2>
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
                Thank you for letting us know. Our team will review your report and follow up shortly.
              </p>
              <button
                onClick={handleClose}
                className="mt-4 bg-forest text-cream text-sm font-medium px-6 py-2.5 rounded-xl hover:bg-sage transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <p className="text-sm text-[#777] font-light">
                Tell us what went wrong with your order and we'll look into it right away.
              </p>

              {/* Report type */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-forest/60 uppercase tracking-widest">
                  Issue Type
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full rounded-xl border-[1.5px] border-sage/40 focus:border-sage focus:ring-2 focus:ring-sage/10 outline-none bg-white px-4 py-3 text-sm text-forest appearance-none"
                >
                  <option value="" disabled>Select an issue type...</option>
                  {REPORT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-forest/60 uppercase tracking-widest">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please describe the issue in detail..."
                  rows={5}
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
