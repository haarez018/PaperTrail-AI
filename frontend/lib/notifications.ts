/**
 * Browser Notification API wrapper for PaperTrail AI deadline alerts.
 * Requests permission once, then lets you schedule and fire notifications.
 */

export type NotificationPermission = "default" | "granted" | "denied";

export function getPermissionStatus(): NotificationPermission {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  return Notification.permission as NotificationPermission;
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  if (Notification.permission === "granted") return "granted";
  const result = await Notification.requestPermission();
  return result as NotificationPermission;
}

export function isNotificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function sendNotification(
  title: string,
  options?: {
    body?: string;
    icon?: string;
    tag?: string;
  }
): void {
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, {
      body: options?.body,
      icon: options?.icon ?? "/icon-192.png",
      tag: options?.tag,
    });
  } catch {
    // Silently ignore (service worker not available in dev)
  }
}

/** Deadline status for a single procedure. */
export interface DeadlineStatus {
  procedureId: string;
  procedureName: string;
  submittedDate: string;       // ISO date string
  statutoryDays: number;       // How many days the office has to respond
  daysElapsed: number;
  daysRemaining: number;
  isOverdue: boolean;
  urgency: "ok" | "warning" | "overdue";
}

/** Calculate deadline status for a procedure given its submitted date. */
export function calcDeadlineStatus(
  procedureId: string,
  procedureName: string,
  submittedDate: string,
  statutoryDays = 30
): DeadlineStatus {
  const submitted = new Date(submittedDate);
  const now = new Date();
  const daysElapsed = Math.floor(
    (now.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysRemaining = statutoryDays - daysElapsed;
  const isOverdue = daysElapsed > statutoryDays;

  let urgency: DeadlineStatus["urgency"] = "ok";
  if (isOverdue) urgency = "overdue";
  else if (daysRemaining <= 7) urgency = "warning";

  return {
    procedureId,
    procedureName,
    submittedDate,
    statutoryDays,
    daysElapsed,
    daysRemaining,
    isOverdue,
    urgency,
  };
}

/** Statutory response times for common TN procedures (days). */
export const STATUTORY_DAYS: Record<string, number> = {
  tn_death_certificate: 7,
  tn_legal_heir_certificate: 30,
  tn_pension_transfer: 30,
  tn_property_mutation: 60,
  tn_aadhaar_update: 90,
  tn_ration_card_update: 45,
  tn_bank_kyc: 15,
  default: 30,
};
