"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Report {
  report_id: number;
  order_id: number;
  customer_id: number;
  report_type: string;
  description: string;
  status: "open" | "in_review" | "resolved";
  created_at: string;
}

const REPORT_TYPE_LABELS: Record<string, string> = {
  damaged_item: "Damaged Item",
  missing_item: "Missing Item",
  wrong_item: "Wrong Item Delivered",
  late_delivery: "Late Delivery",
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

export default function ReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await fetch("http://localhost:5000/reports");
      if (!res.ok) throw new Error("Failed to fetch reports");
      const data = await res.json();
      setReports(data);
    } catch (err) {
      console.error("Error fetching reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (reportId: number, newStatus: string) => {
    setUpdatingId(reportId);
    try {
      const res = await fetch(`http://localhost:5000/reports/${reportId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update report");
      setReports((prev) =>
        prev.map((r) =>
          r.report_id === reportId ? { ...r, status: newStatus as Report["status"] } : r
        )
      );
    } catch (err) {
      console.error("Error updating report:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered =
    filterStatus === "all"
      ? reports
      : reports.filter((r) => r.status === filterStatus);

  const counts = {
    all: reports.length,
    open: reports.filter((r) => r.status === "open").length,
    in_review: reports.filter((r) => r.status === "in_review").length,
    resolved: reports.filter((r) => r.status === "resolved").length,
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <div className="flex min-h-screen bg-cream font-dm">
      {/* Sidebar */}
      <div className="w-64 bg-forest text-cream p-6 shadow-lg">
        <div className="mb-8">
          <h2 className="font-playfair text-2xl font-bold mb-2">OFS</h2>
          <p className="text-cream/80 text-sm">Organic Food Service</p>
        </div>

        <nav className="space-y-2">
          <Link
            href="/empdashboard"
            className="block px-4 py-3 rounded-lg text-cream font-medium transition-colors hover:bg-forest/80"
          >
            Dashboard
          </Link>
          <Link
            href="/inventory"
            className="block px-4 py-3 rounded-lg text-cream font-medium transition-colors hover:bg-forest/80"
          >
            Inventory
          </Link>
          <Link
            href="/orders"
            className="block px-4 py-3 rounded-lg text-cream font-medium transition-colors hover:bg-forest/80"
          >
            Orders
          </Link>
          <Link
            href="/routing"
            className="block px-4 py-3 rounded-lg text-cream font-medium transition-colors hover:bg-forest/80"
          >
            Deliveries
          </Link>
          <Link
            href="/reports"
            className="block px-4 py-3 rounded-lg bg-sage text-white font-medium transition-colors hover:bg-sage/90"
          >
            Reports
          </Link>
          <Link
            href="/settings"
            className="block px-4 py-3 rounded-lg text-cream font-medium transition-colors hover:bg-forest/80"
          >
            Settings
          </Link>
        </nav>

        <div className="mt-auto pt-6 border-t border-cream/20">
          <button
            onClick={() => router.push("/login")}
            className="w-full px-4 py-2 rounded-lg bg-warm/30 text-cream font-medium transition-colors hover:bg-warm/50"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-playfair text-4xl text-forest mb-2">
            Customer Reports
          </h1>
          <p className="text-[#666]">Review and resolve issues submitted by customers.</p>
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-3 mb-6">
          {(["all", "open", "in_review", "resolved"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                filterStatus === s
                  ? "bg-forest text-cream border-forest"
                  : "bg-white text-forest border-forest/10 hover:bg-forest/5"
              }`}
            >
              {s === "all" ? "All" : STATUS_LABELS[s]}
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${filterStatus === s ? "bg-cream/20" : "bg-forest/10"}`}>
                {counts[s]}
              </span>
            </button>
          ))}
        </div>

        {/* Reports list */}
        {loading ? (
          <p className="text-forest/60">Loading reports...</p>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <p className="font-playfair text-xl text-forest/40">No reports found.</p>
            <p className="text-sm text-[#999] mt-2">
              {filterStatus === "all"
                ? "No customer reports have been submitted yet."
                : `No reports with status "${STATUS_LABELS[filterStatus]}".`}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((report) => (
              <div
                key={report.report_id}
                className="bg-white rounded-xl shadow-md p-6 flex flex-col md:flex-row md:items-start justify-between gap-4"
              >
                {/* Left: Report info */}
                <div className="flex-1 flex flex-col gap-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs font-medium text-forest/40 uppercase tracking-widest">
                      Report #{report.report_id}
                    </span>
                    <span className="text-xs text-forest/40">•</span>
                    <span className="text-xs text-forest/40">
                      Order #{report.order_id}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-tighter px-2 py-0.5 rounded-full border ${STATUS_STYLES[report.status]}`}
                    >
                      {STATUS_LABELS[report.status]}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-lg bg-sage/10 text-forest border border-sage/20">
                      {REPORT_TYPE_LABELS[report.report_type] ?? report.report_type}
                    </span>
                    <span className="text-xs text-[#999]">
                      {formatDate(report.created_at)}
                    </span>
                  </div>

                  <p className="text-sm text-[#555] leading-relaxed mt-1">
                    {report.description}
                  </p>
                </div>

                {/* Right: Status controls */}
                <div className="flex flex-col gap-2 min-w-[160px]">
                  <p className="text-[10px] font-medium text-forest/40 uppercase tracking-widest">
                    Update Status
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {(["open", "in_review", "resolved"] as const).map((s) => (
                      <button
                        key={s}
                        disabled={report.status === s || updatingId === report.report_id}
                        onClick={() => handleStatusChange(report.report_id, s)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors disabled:cursor-default ${
                          report.status === s
                            ? `${STATUS_STYLES[s]} cursor-default`
                            : "bg-white text-forest/60 border-forest/10 hover:bg-forest/5 disabled:opacity-50"
                        }`}
                      >
                        {updatingId === report.report_id && report.status !== s
                          ? "..."
                          : STATUS_LABELS[s]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
