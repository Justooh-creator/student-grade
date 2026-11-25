import type { Database } from "@/integrations/supabase/types";

export type Announcement = Database["public"]["Tables"]["developer_announcements"]["Row"];
export const AUDIENCES = [{ value: "all", label: "All Teachers" }, { value: "heads", label: "Headteachers Only" }, { value: "unverified", label: "Unverified Accounts" }] as const;
export const NOTICE_KINDS = [{ value: "update", label: "General Update" }, { value: "tip", label: "Helpful Tip" }, { value: "urgent", label: "Urgent Notice" }] as const;

export function whatsappPhone(input: string): string {
  const digits = input.replace(/[^0-9]/g, "");
  return digits.startsWith("0") && digits.length === 10 ? `233${digits.slice(1)}` : digits;
}

export function announcementError(title: string, body: string, phone: string): string | null {
  if (!title.trim() || title.trim().length > 160) return "Enter a headline (up to 160 characters).";
  if (!body.trim() || body.trim().length > 4000) return "Enter a message (up to 4,000 characters).";
  if (phone && !/^[0-9]{8,15}$/.test(whatsappPhone(phone))) return "Enter a valid WhatsApp phone number.";
  return null;
}