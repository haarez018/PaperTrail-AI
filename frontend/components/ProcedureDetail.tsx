"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generateDocument, getNavigation, generateEscalation } from "@/lib/api";

interface ProcedureDetailProps {
  procedureId: string;
  caseId: string | null;
  onClose: () => void;
}

type Tab = "documents" | "navigate" | "escalate";

export default function ProcedureDetail({
  procedureId,
  caseId,
  onClose,
}: ProcedureDetailProps) {
  const [activeTab, setActiveTab] = useState<Tab>("documents");
  const [docResult, setDocResult] = useState<any>(null);
  const [navResult, setNavResult] = useState<any>(null);
  const [escResult, setEscResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const procName = procedureId
    .replace(/^tn_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

  const handleGenerateDoc = async () => {
    setLoading(true);
    try {
      const result = await generateDocument(procedureId, caseId || undefined);
      setDocResult(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleGetNavigation = async () => {
    setLoading(true);
    try {
      const result = await getNavigation(procedureId);
      setNavResult(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleEscalate = async () => {
    setLoading(true);
    try {
      const result = await generateEscalation(procedureId, "rti", caseId || undefined);
      setEscResult(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = (base64: string, filename: string) => {
    const link = document.createElement("a");
    link.href = `data:application/pdf;base64,${base64}`;
    link.download = filename;
    link.click();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-t bg-gray-50 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">{procName}</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-xl"
        >
          X
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(["documents", "navigate", "escalate"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              if (tab === "documents" && !docResult) handleGenerateDoc();
              if (tab === "navigate" && !navResult) handleGetNavigation();
              if (tab === "escalate" && !escResult) handleEscalate();
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-nyaya-600 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {tab === "documents" ? "Generate Form" : tab === "navigate" ? "Navigate" : "Escalate"}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nyaya-600" />
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* Documents Tab */}
        {activeTab === "documents" && docResult && !loading && (
          <motion.div
            key="docs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="bg-white rounded-lg p-4 border">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">
                  {docResult.procedure_name}
                </h4>
                <button
                  onClick={() => downloadPdf(docResult.pdf_base64, `${procedureId}.pdf`)}
                  className="px-4 py-2 bg-nyaya-600 text-white rounded-lg text-sm font-medium hover:bg-nyaya-700"
                >
                  Download PDF
                </button>
              </div>
              <p className="text-sm text-gray-500 mb-3">
                Fee: Rs. {docResult.fee_inr} | Size: {Math.round(docResult.pdf_size_bytes / 1024)}KB
              </p>

              <h5 className="font-medium text-gray-700 text-sm mb-2">
                Documents Checklist:
              </h5>
              <ul className="space-y-1">
                {docResult.checklist?.map((item: any, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <input type="checkbox" className="mt-0.5 rounded" />
                    <span className={item.mandatory ? "text-gray-900" : "text-gray-500"}>
                      {item.name}
                      {item.mandatory && (
                        <span className="ml-1 text-red-500 text-xs">*required</span>
                      )}
                      {item.where_to_get && (
                        <span className="ml-1 text-gray-400 text-xs">
                          (from: {item.where_to_get})
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}

        {/* Navigate Tab */}
        {activeTab === "navigate" && navResult && !loading && (
          <motion.div
            key="nav"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="bg-white rounded-lg p-4 border">
              <h4 className="font-semibold text-gray-900 mb-1">
                {navResult.office?.name}
              </h4>
              <p className="text-sm text-gray-600">{navResult.office?.address}</p>
              <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                <div>
                  <span className="text-gray-500">Counter:</span>{" "}
                  <span className="font-medium">{navResult.office?.counter}</span>
                </div>
                <div>
                  <span className="text-gray-500">Hours:</span>{" "}
                  <span className="font-medium">{navResult.office?.hours}</span>
                </div>
                <div>
                  <span className="text-gray-500">Avg wait:</span>{" "}
                  <span className="font-medium">{navResult.average_wait_minutes} min</span>
                </div>
                <div>
                  <span className="text-gray-500">Best time:</span>{" "}
                  <span className="font-medium">{navResult.best_time_to_visit}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border">
              <h5 className="font-medium text-gray-700 text-sm mb-2">What to say:</h5>
              <p className="text-sm text-gray-600 italic">{navResult.what_to_say}</p>
            </div>

            {navResult.if_they_ask_X_say_Y?.length > 0 && (
              <div className="bg-saffron-400/10 rounded-lg p-4 border border-saffron-400/30">
                <h5 className="font-medium text-saffron-600 text-sm mb-2">
                  Pro Tips (if they push back):
                </h5>
                {navResult.if_they_ask_X_say_Y.map((tip: any, i: number) => (
                  <div key={i} className="mb-2 text-sm">
                    <p className="text-gray-700">
                      <strong>If asked:</strong> &ldquo;{tip.if_asked}&rdquo;
                    </p>
                    <p className="text-nyaya-700 mt-0.5">
                      <strong>Say:</strong> &ldquo;{tip.say}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Escalate Tab */}
        {activeTab === "escalate" && escResult && !loading && (
          <motion.div
            key="esc"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <h4 className="font-semibold text-red-800 mb-2">
                RTI Application Ready
              </h4>
              <p className="text-sm text-red-700 mb-3">
                If this procedure stalls beyond the stipulated time, use this
                pre-drafted RTI application to legally compel a response.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    downloadPdf(escResult.pdf_base64, `${procedureId}_rti.pdf`)
                  }
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
                >
                  Download RTI PDF
                </button>
              </div>
              <div className="mt-3 text-sm text-red-600">
                <p>
                  <strong>Legal basis:</strong>{" "}
                  {escResult.letter?.legal_citations?.join(", ")}
                </p>
                <p className="mt-1">
                  <strong>Expected response:</strong>{" "}
                  {escResult.letter?.expected_response_days} days
                </p>
                <p className="mt-1">
                  <strong>Fee:</strong> Rs. {escResult.letter?.fee_inr}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border">
              <h5 className="font-medium text-gray-700 text-sm mb-2">
                How to submit:
              </h5>
              <ul className="space-y-1">
                {escResult.letter?.submission_methods?.map(
                  (method: string, i: number) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-nyaya-600 mt-0.5">-</span>
                      {method}
                    </li>
                  )
                )}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
