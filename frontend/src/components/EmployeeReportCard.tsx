"use client";

import { useState, useEffect, useRef } from "react";
import {
  updateReportStatus,
  submitRefund,
  fetchReportMessages,
  sendReportMessage,
  fetchOrderItems,
  type ReportItem,
  type ReportMessage,
  type OrderItemDetail,
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
  none: "",
  partial: "bg-orange-100 text-orange-700 border-orange-200",
  full: "bg-green-100 text-green-700 border-green-200",
};

interface Props {
  report: ReportItem;
  onUpdated: (updated: ReportItem) => void;
}

export default function EmployeeReportCard({ report, onUpdated }: Props) {
  const [expanded, setExpanded] = useState(false);

  // Message signal — tracks count + last sender role locally so it refreshes after sends
  const [msgCount, setMsgCount] = useState(report.message_count ?? 0);
  const [lastMsgRole, setLastMsgRole] = useState<"employee" | "customer" | null>(
    report.last_message_role ?? null
  );

  // Status
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Messages
  const [messages, setMessages] = useState<ReportMessage[]>([]);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Refund
  const [orderItems, setOrderItems] = useState<OrderItemDetail[]>([]);
  const [itemsLoaded, setItemsLoaded] = useState(false);
  const [refundMode, setRefundMode] = useState<null | "full" | "partial">(null);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [issuingRefund, setIssuingRefund] = useState(false);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  // Load messages + order items when expanded
  useEffect(() => {
    if (!expanded) return;

    if (!messagesLoaded) {
      fetchReportMessages(report.report_id)
        .then((data) => {
          setMessages(data);
          setMessagesLoaded(true);
        })
        .catch(console.error);
    }

    if (!itemsLoaded) {
      fetchOrderItems(report.order_id)
        .then((data) => {
          setOrderItems(data);
          setItemsLoaded(true);
        })
        .catch(console.error);
    }
  }, [expanded]);

  useEffect(() => {
    if (expanded && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, expanded]);

  const handleStatusChange = async (newStatus: ReportItem["status"]) => {
    setUpdatingStatus(true);
    try {
      await updateReportStatus(report.report_id, newStatus);
      onUpdated({ ...report, status: newStatus });
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    setSendingMessage(true);
    try {
      await sendReportMessage(report.report_id, newMessage.trim());
      const updated = await fetchReportMessages(report.report_id);
      setMessages(updated);
      setMsgCount(updated.length);
      setLastMsgRole("employee");
      setNewMessage("");
    } catch (err) {
      console.error(err);
    } finally {
      setSendingMessage(false);
    }
  };

  const partialRefundAmount = () => {
    return orderItems
      .filter((item) => selectedItems.has(item.order_item_id))
      .reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  };

  const handleRefund = async () => {
    setIssuingRefund(true);
    try {
      if (refundMode === "full") {
        const res = await submitRefund(report.report_id, "full");
        onUpdated({
          ...report,
          refund_status: "full",
          refund_amount: res.refund_amount,
        });
      } else if (refundMode === "partial") {
        const amount = partialRefundAmount();
        const res = await submitRefund(report.report_id, "partial", amount);
        onUpdated({
          ...report,
          refund_status: "partial",
          refund_amount: res.refund_amount,
        });
      }
      setRefundMode(null);
      setSelectedItems(new Set());
    } catch (err) {
      console.error(err);
    } finally {
      setIssuingRefund(false);
    }
  };

  const toggleItem = (id: number) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const alreadyRefunded = report.refund_status && report.refund_status !== "none";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-forest/5 overflow-hidden">
      {/* Summary row */}
      <div className="p-5 flex flex-col md:flex-row md:items-start gap-4">
        {/* Left info */}
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-medium text-forest/40 uppercase tracking-widest">
              Report #{report.report_id}
            </span>
            <span className="text-xs text-forest/40">•</span>
            <span className="text-xs text-forest/40">Order #{report.order_id}</span>
            {report.customer_name && (
              <>
                <span className="text-xs text-forest/40">•</span>
                <span className="text-xs font-medium text-forest/70">{report.customer_name}</span>
              </>
            )}
            <span className={`text-[10px] font-bold uppercase tracking-tighter px-2 py-0.5 rounded-full border ${STATUS_STYLES[report.status]}`}>
              {STATUS_LABELS[report.status]}
            </span>
            {alreadyRefunded && (
              <span className={`text-[10px] font-bold uppercase tracking-tighter px-2 py-0.5 rounded-full border ${REFUND_BADGE[report.refund_status!]}`}>
                {report.refund_status} refund ${report.refund_amount?.toFixed(2)}
              </span>
            )}
            {msgCount > 0 && (
              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                lastMsgRole === "customer"
                  ? "bg-orange-100 text-orange-700 border-orange-200"
                  : "bg-forest/5 text-forest/50 border-forest/10"
              }`}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                  <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97z" clipRule="evenodd" />
                </svg>
                {msgCount}
                {lastMsgRole === "customer" && <span className="ml-0.5">· needs reply</span>}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-lg bg-sage/10 text-forest border border-sage/20">
              {REPORT_TYPE_LABELS[report.report_type] ?? report.report_type}
            </span>
            <span className="text-xs text-[#999]">{formatDate(report.created_at)}</span>
            {report.order_total != null && (
              <span className="text-xs text-forest/50">Order total: ${report.order_total.toFixed(2)}</span>
            )}
          </div>

          <p className="text-sm text-[#555] leading-relaxed">{report.description}</p>
        </div>

        {/* Right: status + expand */}
        <div className="flex flex-col gap-2 min-w-[160px] shrink-0">
          <p className="text-[10px] font-medium text-forest/40 uppercase tracking-widest">Status</p>
          <div className="flex flex-col gap-1.5">
            {(["open", "in_review", "resolved"] as const).map((s) => (
              <button
                key={s}
                disabled={report.status === s || updatingStatus}
                onClick={() => handleStatusChange(s)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors disabled:cursor-default ${
                  report.status === s
                    ? `${STATUS_STYLES[s]} cursor-default`
                    : "bg-white text-forest/60 border-forest/10 hover:bg-forest/5 disabled:opacity-50"
                }`}
              >
                {updatingStatus && report.status !== s ? "..." : STATUS_LABELS[s]}
              </button>
            ))}
          </div>

          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-2 text-xs font-medium text-forest/60 hover:text-forest border border-forest/10 rounded-lg px-3 py-1.5 transition-colors hover:bg-forest/5 flex items-center gap-1.5 justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
            {expanded ? "Collapse" : "Expand"}
          </button>
        </div>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div className="border-t border-forest/5 p-5 flex flex-col gap-6 bg-cream/40">

          {/* Refund section */}
          <div>
            <p className="text-xs font-medium text-forest/50 uppercase tracking-widest mb-3">Refund</p>

            {alreadyRefunded ? (
              <div className="text-sm text-forest/60 bg-white rounded-lg px-4 py-3 border border-forest/5">
                A <strong>{report.refund_status}</strong> refund of <strong>${report.refund_amount?.toFixed(2)}</strong> has already been issued.
              </div>
            ) : refundMode === null ? (
              <div className="flex gap-2">
                <button
                  onClick={() => setRefundMode("full")}
                  className="text-xs font-medium px-3 py-2 rounded-lg bg-forest text-cream hover:bg-sage transition-colors"
                >
                  Full Refund
                </button>
                <button
                  onClick={() => setRefundMode("partial")}
                  className="text-xs font-medium px-3 py-2 rounded-lg border border-forest/15 text-forest hover:bg-forest/5 transition-colors"
                >
                  Partial Refund
                </button>
              </div>
            ) : refundMode === "full" ? (
              <div className="bg-white rounded-lg border border-forest/5 p-4 flex flex-col gap-3">
                <p className="text-sm text-forest">
                  Issue a <strong>full refund</strong> of{" "}
                  <strong>${report.order_total?.toFixed(2) ?? "—"}</strong> for Order #{report.order_id}?
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={issuingRefund}
                    onClick={handleRefund}
                    className="text-xs font-medium px-4 py-2 rounded-lg bg-forest text-cream hover:bg-sage transition-colors disabled:opacity-50"
                  >
                    {issuingRefund ? "Processing..." : "Confirm Full Refund"}
                  </button>
                  <button
                    onClick={() => setRefundMode(null)}
                    className="text-xs font-medium px-3 py-2 rounded-lg border border-forest/10 text-forest/60 hover:bg-forest/5 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* Partial refund — item checklist */
              <div className="bg-white rounded-lg border border-forest/5 p-4 flex flex-col gap-3">
                <p className="text-xs font-medium text-forest/50 uppercase tracking-widest mb-1">Select items to refund</p>
                {!itemsLoaded ? (
                  <p className="text-sm text-forest/40">Loading items...</p>
                ) : orderItems.length === 0 ? (
                  <p className="text-sm text-forest/40">No items found.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {orderItems.map((item) => (
                      <label
                        key={item.order_item_id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedItems.has(item.order_item_id)
                            ? "bg-sage/10 border-sage/30"
                            : "border-forest/10 hover:bg-forest/3"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item.order_item_id)}
                          onChange={() => toggleItem(item.order_item_id)}
                          className="accent-sage shrink-0"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-forest">{item.product_name}</p>
                          <p className="text-xs text-[#999]">Qty: {item.quantity} × ${item.unit_price.toFixed(2)}</p>
                        </div>
                        <span className="text-sm font-medium text-forest">${(item.unit_price * item.quantity).toFixed(2)}</span>
                      </label>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between pt-1">
                  <p className="text-sm text-forest/70">
                    Refund total: <strong>${partialRefundAmount().toFixed(2)}</strong>
                  </p>
                  <div className="flex gap-2">
                    <button
                      disabled={issuingRefund || selectedItems.size === 0}
                      onClick={handleRefund}
                      className="text-xs font-medium px-4 py-2 rounded-lg bg-forest text-cream hover:bg-sage transition-colors disabled:opacity-50"
                    >
                      {issuingRefund ? "Processing..." : "Issue Partial Refund"}
                    </button>
                    <button
                      onClick={() => { setRefundMode(null); setSelectedItems(new Set()); }}
                      className="text-xs font-medium px-3 py-2 rounded-lg border border-forest/10 text-forest/60 hover:bg-forest/5 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Message thread */}
          <div>
            <p className="text-xs font-medium text-forest/50 uppercase tracking-widest mb-3">Message Thread</p>

            <div className="bg-white rounded-lg border border-forest/5 flex flex-col">
              {/* Messages */}
              <div className="flex flex-col gap-3 p-4 max-h-64 overflow-y-auto">
                {!messagesLoaded ? (
                  <p className="text-sm text-forest/40 text-center py-4">Loading...</p>
                ) : messages.length === 0 ? (
                  <p className="text-sm text-forest/40 text-center py-4">No messages yet. Start the conversation below.</p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.message_id}
                      className={`flex flex-col gap-0.5 ${msg.sender_role === "employee" ? "items-end" : "items-start"}`}
                    >
                      <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        msg.sender_role === "employee"
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

              {/* Input */}
              <div className="border-t border-forest/5 p-3 flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                  placeholder="Write a message to the customer..."
                  className="flex-1 text-sm rounded-lg border border-forest/10 px-3 py-2 outline-none focus:border-sage/50 focus:ring-1 focus:ring-sage/20 text-forest bg-cream/60"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={sendingMessage || !newMessage.trim()}
                  className="text-xs font-medium px-4 py-2 rounded-lg bg-forest text-cream hover:bg-sage transition-colors disabled:opacity-40"
                >
                  {sendingMessage ? "..." : "Send"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
