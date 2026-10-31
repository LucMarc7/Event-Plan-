// src/api/subscription.ts
import api from "./client";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════
export type PlanId = "free" | "standard" | "premium" | "vip";

export interface PlanLimits {
  max_events: number | null;
  max_guests_per_event: number | null;
  max_controllers_per_event: number | null;
  max_themes_per_event: number | null;
  can_export_pdf_multiple: boolean;
  can_view_advanced_stats: boolean;
  has_priority_support: boolean;
  has_vip_access: boolean;
  cashback_percent: number;
}

export interface SubscriptionLimitsResponse {
  plan: PlanId;
  plan_label: string;
  limits: PlanLimits;
  all_plans: Record<PlanId, PlanLimits>;
}

// ═══════════════════════════════════════════════════════════════
// API
// ═══════════════════════════════════════════════════════════════
export const fetchSubscriptionLimits =
  async (): Promise<SubscriptionLimitsResponse> => {
    const response = await api.get("/accounts/subscription-limits/");
    return response.data;
  };
