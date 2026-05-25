"use client";

import { useState } from "react";
import {
  Button,
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Badge,
  Input,
  TextArea,
  Modal,
  Tooltip,
  ProgressBar,
  Timeline,
  LanguageToggle,
  LoadingSpinner,
  Avatar,
  ToastContainer,
  Skeleton,
  CardSkeleton,
} from "@/components/ui";
import type { TimelineItem, ToastVariant } from "@/components/ui";
import { FileText, Scale, Send, ArrowRight } from "lucide-react";

const sampleTimeline: TimelineItem[] = [
  { id: "1", title: "Application submitted", description: "Death certificate application filed at Chennai Sub-Registrar", status: "done", date: "May 1" },
  { id: "2", title: "Document verification", description: "Documents under review by registrar office", status: "done", date: "May 3" },
  { id: "3", title: "Field inquiry", description: "Revenue inspector visit scheduled", status: "active", date: "Today" },
  { id: "4", title: "Certificate issued", status: "pending" },
  { id: "5", title: "Pension transfer", description: "Blocked — requires death certificate first", status: "blocked" },
];

export default function DesignSystemPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [toasts, setToasts] = useState<{ id: string; message: string; variant: ToastVariant }[]>([]);

  const addToast = (variant: ToastVariant) => {
    const msgs: Record<ToastVariant, string> = {
      success: "Document generated successfully",
      warning: "Deadline approaching — 3 days left",
      error: "Failed to connect to server",
      info: "Case ID: PT-2026-04821",
    };
    setToasts((prev) => [...prev, { id: Date.now().toString(), message: msgs[variant], variant }]);
  };

  const dismissToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <div className="min-h-screen bg-ivory">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <header className="border-b border-paper-dark bg-surface/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <h1 className="font-display text-2xl sm:text-3xl text-navy">PaperTrail AI Design System</h1>
          <p className="mt-1 text-sm text-text-secondary">Phase 1 — Component Library Showcase</p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-12 px-4 py-8 sm:px-6">

        {/* ── Colors ── */}
        <section>
          <h2 className="font-display text-xl text-navy mb-4">Color Palette</h2>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {[
              { name: "Saffron", cls: "bg-saffron" },
              { name: "Saffron Light", cls: "bg-saffron-light" },
              { name: "Navy", cls: "bg-navy" },
              { name: "Ivory", cls: "bg-ivory border border-paper-dark" },
              { name: "Paper", cls: "bg-paper" },
              { name: "Success", cls: "bg-success" },
              { name: "Warning", cls: "bg-warning" },
              { name: "Danger", cls: "bg-danger" },
              { name: "Info", cls: "bg-info" },
              { name: "Pending", cls: "bg-pending" },
            ].map((c) => (
              <div key={c.name} className="text-center">
                <div className={`h-12 rounded-[var(--radius-md)] ${c.cls}`} />
                <span className="mt-1 block text-xs text-text-secondary">{c.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Typography ── */}
        <section>
          <h2 className="font-display text-xl text-navy mb-4">Typography</h2>
          <Card>
            <CardContent>
              <h1 className="font-display text-4xl text-navy">Display — DM Serif Display</h1>
              <p className="mt-2 text-lg text-text-primary">Body — Source Sans 3, regular weight</p>
              <p className="mt-1 text-sm text-text-secondary">Secondary text in muted tones</p>
              <p className="mt-1 font-mono text-sm text-text-muted">PT-2026-04821 — JetBrains Mono</p>
              <p className="mt-1 font-tamil text-base">தமிழ் உரை — Noto Sans Tamil</p>
              <p className="mt-1 font-hindi text-base">हिन्दी पाठ — Noto Sans Devanagari</p>
            </CardContent>
          </Card>
        </section>

        {/* ── Buttons ── */}
        <section>
          <h2 className="font-display text-xl text-navy mb-4">Buttons</h2>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary"><Send size={16} /> Submit</Button>
            <Button variant="secondary"><Scale size={16} /> Legal Aid</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Reject</Button>
            <Button variant="primary" size="sm">Small</Button>
            <Button variant="primary" size="lg">Large</Button>
            <Button variant="primary" disabled>Disabled</Button>
          </div>
        </section>

        {/* ── Badges ── */}
        <section>
          <h2 className="font-display text-xl text-navy mb-4">Status Badges</h2>
          <div className="flex flex-wrap gap-3">
            <Badge status="pending">Pending</Badge>
            <Badge status="active">Active</Badge>
            <Badge status="in_progress">In Progress</Badge>
            <Badge status="done">Done</Badge>
            <Badge status="blocked">Blocked</Badge>
            <Badge status="escalated">Escalated</Badge>
          </div>
        </section>

        {/* ── Inputs ── */}
        <section>
          <h2 className="font-display text-xl text-navy mb-4">Form Controls</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">Full Name</label>
              <Input placeholder="Enter applicant name" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">Case ID</label>
              <Input placeholder="PT-2026-XXXXX" className="font-mono" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-text-primary">Describe your situation</label>
              <TextArea placeholder="Tell us what happened..." rows={3} />
            </div>
          </div>
        </section>

        {/* ── Cards ── */}
        <section>
          <h2 className="font-display text-xl text-navy mb-4">Cards</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card hoverable>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <FileText size={20} className="text-saffron" />
                  <h3 className="font-display text-lg text-navy">Death Certificate</h3>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-secondary">Application for death certificate at Chennai Sub-Registrar office. Requires: ID proof, hospital records.</p>
              </CardContent>
              <CardFooter>
                <Badge status="active">Active</Badge>
                <Button variant="ghost" size="sm">View <ArrowRight size={14} /></Button>
              </CardFooter>
            </Card>
            <CardSkeleton />
          </div>
        </section>

        {/* ── Progress ── */}
        <section>
          <h2 className="font-display text-xl text-navy mb-4">Progress Bars</h2>
          <div className="space-y-4">
            <ProgressBar value={75} label="Death Certificate" />
            <ProgressBar value={30} label="Pension Transfer" />
            <ProgressBar value={100} label="Aadhaar Linked" />
          </div>
        </section>

        {/* ── Timeline ── */}
        <section>
          <h2 className="font-display text-xl text-navy mb-4">Procedure Timeline</h2>
          <Card>
            <CardContent>
              <Timeline items={sampleTimeline} />
            </CardContent>
          </Card>
        </section>

        {/* ── Avatars ── */}
        <section>
          <h2 className="font-display text-xl text-navy mb-4">Avatars</h2>
          <div className="flex items-center gap-4">
            <Avatar type="agent" size="sm" />
            <Avatar type="agent" size="md" />
            <Avatar type="agent" size="lg" />
            <Avatar type="user" size="sm" />
            <Avatar type="user" size="md" />
            <Avatar type="user" size="lg" />
            <Avatar type="user" initials="HR" size="md" />
          </div>
        </section>

        {/* ── Language Toggle ── */}
        <section>
          <h2 className="font-display text-xl text-navy mb-4">Language Toggle</h2>
          <LanguageToggle />
        </section>

        {/* ── Loading ── */}
        <section>
          <h2 className="font-display text-xl text-navy mb-4">Loading States</h2>
          <div className="flex items-center gap-6">
            <LoadingSpinner size="sm" />
            <LoadingSpinner size="md" />
            <LoadingSpinner size="lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-52" />
            </div>
          </div>
        </section>

        {/* ── Tooltips ── */}
        <section>
          <h2 className="font-display text-xl text-navy mb-4">Tooltips</h2>
          <div className="flex gap-4">
            <Tooltip content="Sub-Registrar office handles birth, death, and marriage certificates">
              <Button variant="outline" size="sm">Hover me (top)</Button>
            </Tooltip>
            <Tooltip content="RTI = Right to Information Act, 2005" side="bottom">
              <Button variant="outline" size="sm">Hover me (bottom)</Button>
            </Tooltip>
          </div>
        </section>

        {/* ── Toasts ── */}
        <section>
          <h2 className="font-display text-xl text-navy mb-4">Toast Notifications</h2>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" size="sm" onClick={() => addToast("success")}>Success</Button>
            <Button variant="outline" size="sm" onClick={() => addToast("warning")}>Warning</Button>
            <Button variant="danger" size="sm" onClick={() => addToast("error")}>Error</Button>
            <Button variant="secondary" size="sm" onClick={() => addToast("info")}>Info</Button>
          </div>
        </section>

        {/* ── Modal ── */}
        <section>
          <h2 className="font-display text-xl text-navy mb-4">Modal</h2>
          <Button variant="outline" onClick={() => setModalOpen(true)}>Open Modal</Button>
          <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Confirm Submission">
            <p className="text-text-secondary">Are you sure you want to submit this death certificate application? This will initiate the process at the Sub-Registrar office.</p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => setModalOpen(false)}>Confirm</Button>
            </div>
          </Modal>
        </section>

      </main>

      <footer className="border-t border-paper-dark py-6 text-center text-sm text-text-muted">
        PaperTrail AI Design System v1.0 — Phase 1 Complete
      </footer>
    </div>
  );
}
