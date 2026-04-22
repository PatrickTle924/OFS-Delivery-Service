"use client";

import { useEffect, useState, useRef } from "react";
import Navbar from "@/components/Navbar";
import CustomerRoute from "@/components/CustomerRoute";
import {
  fetchMyReports,
  fetchReportMessages,
  sendReportMessage,
  type ReportItem,
  type ReportMessage,
} from "@/lib/api-service";

const REPORT_TYPE_LABELS: Record<string, string> = {
  damaged_item: "Damaged Item",
  missing_item: "Missing Item",
  wrong_item: "Wrong Item Delivered",
  late_delivery: "Late Delivery",
  poor_quality: "Poor Quality",
  other: "Other",
};

const STATUS_STYLES: Record<string, string> = {
  open: "bg-red-100 text-red-700 border-red-200",
  in_review: "bg-yellow-100 text-yellow-700 border-yellow-200",
  resolved: "bg-green-100 text-green-700 border-green-200",
};

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_review: "In Review",
  resolved: "Resolved",
};

const REFUND_BADGE: Record<string, string> = {
  partial: "bg-orange-100 text-orange-700 border-orange-200",
  full: "bg-green-100 text-green-700 border-green-200",
};

function TicketCard({ report }: { report: ReportItem }) {
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<ReportMessage[]>([]);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Message signal
  const [msgCount, setMsgCount] = useState(report.message_count ?? 0);
  const [lastMsgRole, setLastMsgRole] = useState<"employee" | "customer" | null>(
    report.last_message_role ?? null
  );

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  useEffect(() => {
    if (!expanded || messagesLoaded) return;
    fetchReportMessages(report.report_id)
      .then((data) => {
        setMessages(data);
        setMessagesLoaded(true);
      })
      .catch(console.error);
  }, [expanded]);

  useEffect(() => {
    if (expanded && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, expanded]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      await sendReportMessage(report.report_id, newMessage.trim());
      const updated = await fetchReportMessages(report.report_id);
      setMessages(updated);
      setMsgCount(updated.length);
      setLastMsgRole("customer");
      setNewMessage("");
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const hasRefund = report.refund_status && report.refund_status !== "none";

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/90 shadow-sm overflow-hidden">
      {/* Summary */}
      <div className="p-5 flex flex-col md:flex-row md:items-start gap-4">
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-medium text-forest/40 uppercase tracking-widest">
              Ticket #{report.report_id}
            </span>
            <span className="text-xs text-forest/40">•</span>
            <span className="text-xs text-forest/40">Order #{report.order_id}</span>
            <span className={`text-[10px] font-bold uppercase tracking-tighter px-2 py-0.5 rounded-full border ${STATUS_STYLES[report.status]}`}>
              {STATUS_LABELS[report.status]}
            </span>
            {hasRefund && (
              <span className={`text-[10px] font-bold uppercase tracking-tighter px-2 py-0.5 rounded-full border ${REFUND_BADGE[report.refund_status!]}`}>
                {report.refund_status} refund ${report.refund_amount?.toFixed(2)}
              </span>
            )}
            {msgCount > 0 && (
              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                lastMsgRole === "employee"
                  ? "bg-sage/20 text-forest border-sage/40"
                  : "bg-forest/5 text-forest/50 border-forest/10"
              }`}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                  <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97z" clipRule="evenodd" />
                </svg>
                {msgCount}
                {lastMsgRole === "employee" && <span className="ml-0.5">· new reply</span>}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-lg bg-sage/10 text-forest border border-sage/20">
              {REPORT_TYPE_LABELS[report.report_type] ?? report.report_type}
            </span>
            <span className="text-xs text-[#999]">{formatDate(report.created_at)}</span>
          </div>

          <p className="text-sm text-[#555] leading-relaxed">{report.description}</p>
        </div>

        <button
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0 text-xs font-medium text-forest/60 hover:text-forest border border-forest/10 rounded-lg px-3 py-1.5 transition-colors hover:bg-forest/5 flex items-center gap-1.5 self-start"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
          {expanded ? "Hide messages" : "View messages"}
        </button>
      </div>

      {/* Message thread */}
      {expanded && (
        <div className="border-t border-forest/5 p-5 bg-cream/30">
          <p className="text-xs font-medium text-forest/40 uppercase tracking-widest mb-3">Messages</p>

          <div className="bg-white rounded-xl border border-forest/5 flex flex-col">
            <div className="flex flex-col gap-3 p-4 max-h-72 overflow-y-auto">
              {!messagesLoaded ? (
                <p className="text-sm text-forest/40 text-center py-6">Loading...</p>
              ) : messages.length === 0 ? (
                <p className="text-sm text-forest/40 text-center py-6">
                  No messages yet. You can write a follow-up below.
                </p>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.message_id}
                    className={`flex flex-col gap-0.5 ${msg.sender_role === "customer" ? "items-end" : "items-start"}`}
                  >
                    <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.sender_role === "customer"
                        ? "bg-forest text-cream rounded-br-sm"
                        : "bg-sage/15 text-forest rounded-bl-sm"
                    }`}>
                      {msg.message}
                    </div>
                    <p className="text-[10px] text-[#aaa] px-1">
                      {msg.sender_name} · {new Date(msg.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    </p>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-forest/5 p-3 flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="Add a follow-up message..."
                className="flex-1 text-sm rounded-lg border border-forest/10 px-3 py-2 outline-none focus:border-sage/50 focus:ring-1 focus:ring-sage/20 text-forest bg-cream/60"
              />
              <button
                onClick={handleSend}
                disabled={sending || !newMessage.trim()}
                className="text-xs font-medium px-4 py-2 rounded-lg bg-forest text-cream hover:bg-sage transition-colors disabled:opacity-40"
              >
                {sending ? "..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TicketsPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyReports()
      .then(setReports)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <CustomerRoute>
      <div className="min-h-screen bg-cream font-dm">
        <Navbar alwaysFrosted />

        <main className="max-w-3xl mx-auto px-6 pt-28 pb-16">
          <div className="mb-8">
            <h1 className="font-playfair text-4xl text-forest mb-2">My Tickets</h1>
            <p className="text-[#666] text-sm">
              Track the status of issues you've reported and message our team.
            </p>
          </div>

          {loading ? (
            <p className="text-forest/50">Loading your tickets...</p>
          ) : reports.length === 0 ? (
            <div className="bg-white/80 rounded-2xl border border-white/90 p-12 text-center shadow-sm">
              <p className="font-playfair text-xl text-forest/40 mb-2">No tickets yet</p>
              <p className="text-sm text-[#999]">
                If you have a problem with an order, use the "Report Issue" button on your order history page.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {reports.map((report) => (
                <TicketCard key={report.report_id} report={report} />
              ))}
            </div>
          )}
        </main>
      </div>
    </CustomerRoute>
  );
}
