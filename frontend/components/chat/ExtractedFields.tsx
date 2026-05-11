"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Edit2, X, AlertCircle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

interface ExtractedFieldsProps {
  fields: Record<string, string>;
  confidence: number;
  documentType: string;
  onConfirm: (fields: Record<string, string>, summary: string) => void;
  onDismiss: () => void;
}

const FIELD_LABELS: Record<string, string> = {
  name: "Full Name",
  dob: "Date of Birth",
  aadhaar_number: "Aadhaar",
  address: "Address",
  father_name: "Father / Husband",
  gender: "Gender",
  pincode: "PIN Code",
  district: "District",
  state: "State",
  certificate_number: "Certificate No.",
  issue_date: "Issue Date",
};

const DOC_LABELS: Record<string, string> = {
  aadhaar: "Aadhaar Card",
  death_cert: "Death Certificate",
  ration_card: "Ration Card",
  certificate: "Certificate",
  identity_document: "Identity Document",
  unknown: "Document",
};

/**
 * Shows extracted document fields as editable chips.
 * User reviews, edits if needed, then confirms to inject into chat.
 */
export function ExtractedFields({
  fields,
  confidence,
  documentType,
  onConfirm,
  onDismiss,
}: ExtractedFieldsProps) {
  const [editedFields, setEditedFields] = useState<Record<string, string>>(fields);
  const [editingKey, setEditingKey] = useState<string | null>(null);

  const docLabel = DOC_LABELS[documentType] ?? "Document";
  const confidencePct = Math.round(confidence * 100);
  const fieldEntries = Object.entries(editedFields);

  const handleEdit = (key: string, value: string) => {
    setEditedFields((prev) => ({ ...prev, [key]: value }));
  };

  const handleConfirm = () => {
    // Build a natural-language summary to inject into the chat
    const lines = Object.entries(editedFields).map(
      ([k, v]) => `${FIELD_LABELS[k] ?? k}: ${v}`
    );
    const summary = `[Scanned ${docLabel}]\n${lines.join("\n")}`;
    onConfirm(editedFields, summary);
  };

  if (fieldEntries.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[var(--radius-md)] border border-warning/30 bg-warning/10 p-4"
      >
        <div className="flex items-start gap-3">
          <AlertCircle size={18} className="shrink-0 text-warning mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-navy">No fields extracted</p>
            <p className="text-xs text-text-secondary mt-1">
              The image couldn&apos;t be read. Make sure it&apos;s well-lit and in focus.
              A vision model (llava) must be installed: <code className="font-mono text-[10px]">ollama pull llava</code>
            </p>
            <button
              onClick={onDismiss}
              className="mt-2 text-xs text-text-muted underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[var(--radius-md)] border border-saffron/30 bg-saffron-light/20 p-4"
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-navy">
            {docLabel} scanned
          </p>
          <p className="text-xs text-text-muted">
            {fieldEntries.length} fields · {confidencePct}% confidence · Review and confirm
          </p>
        </div>
        <button onClick={onDismiss} className="text-text-muted hover:text-navy">
          <X size={16} />
        </button>
      </div>

      {/* Field chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        <AnimatePresence>
          {fieldEntries.map(([key, value]) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group relative"
            >
              {editingKey === key ? (
                <div className="flex items-center gap-1 rounded-full border border-saffron bg-surface px-2 py-1">
                  <input
                    autoFocus
                    value={editedFields[key]}
                    onChange={(e) => handleEdit(key, e.target.value)}
                    onBlur={() => setEditingKey(null)}
                    onKeyDown={(e) => e.key === "Enter" && setEditingKey(null)}
                    className="w-32 text-xs bg-transparent outline-none text-navy"
                  />
                  <button onClick={() => setEditingKey(null)}>
                    <Check size={12} className="text-success" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditingKey(key)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border border-paper-dark bg-surface px-3 py-1.5 text-xs",
                    "hover:border-saffron/50 hover:bg-saffron-light/30 transition-all"
                  )}
                  title="Click to edit"
                >
                  <span className="font-semibold text-text-muted">
                    {FIELD_LABELS[key] ?? key}:
                  </span>
                  <span className="text-navy max-w-[120px] truncate">{value}</span>
                  <Edit2 size={10} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleConfirm}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-saffron px-3 py-1.5 text-xs font-semibold text-white",
            "hover:bg-saffron-dark transition-colors"
          )}
        >
          <ChevronRight size={14} />
          Use these details
        </button>
        <button
          onClick={onDismiss}
          className="text-xs text-text-muted hover:text-navy underline"
        >
          Cancel
        </button>
        <span className="ml-auto text-[10px] text-text-muted">
          🔒 Processed locally — never sent to cloud
        </span>
      </div>
    </motion.div>
  );
}
