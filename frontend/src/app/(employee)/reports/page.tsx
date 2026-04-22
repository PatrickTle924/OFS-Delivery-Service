"use client";

import { useEffect, useState } from "react";
import EmployeeRoute from "@/components/EmployeeRoute";
import EmployeeSidebar from "@/components/EmployeeSidebar";
import EmployeeReportCard from "@/components/EmployeeReportCard";
import { fetchReports, type ReportItem } from "@/lib/api-service";

const STATUS_LABELS: Record<ReportItem["status"], string> = {
  open: "Open",
  in_review: "In Review",
  resolved: "Resolved",
};

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"all" | ReportItem["status"]>("all");

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await fetchReports();
      setReports(data);
    } catch (err) {
      console.error("Error fetching reports:", err);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdated = (updated: ReportItem) => {
    setReports((prev: ReportItem[]) =>
      prev.map((r: ReportItem) => (r.report_id === updated.report_id ? updated : r))
    );
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

  return (
    <EmployeeRoute>
      <div className="min-h-screen bg-cream font-dm">
        <EmployeeSidebar active="reports" />

        <main className="p-8">
          <div className="mb-8">
            <h1 className="font-playfair text-4xl text-forest mb-2">Customer Reports</h1>
            <p className="text-[#666]">Review and resolve issues submitted by customers.</p>
          </div>

          <div className="flex gap-3 mb-6 flex-wrap">
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
                <span
                  className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                    filterStatus === s ? "bg-cream/20" : "bg-forest/10"
                  }`}
                >
                  {counts[s]}
                </span>
              </button>
            ))}
          </div>

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
            <div className="flex flex-col gap-3">
              {filtered.map((report) => (
                <EmployeeReportCard
                  key={report.report_id}
                  report={report}
                  onUpdated={handleUpdated}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </EmployeeRoute>
  );
}
