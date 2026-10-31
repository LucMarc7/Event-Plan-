// src/hooks/useSubscription.ts
import { useCallback, useEffect, useState } from "react";
import {
    fetchSubscriptionLimits,
    PlanId,
    PlanLimits,
    SubscriptionLimitsResponse,
} from "../api/subscription";

// Cache en mémoire (partagé entre tous les composants)
let cache: {
  data: SubscriptionLimitsResponse | null;
  timestamp: number;
} = { data: null, timestamp: 0 };

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const PLAN_HIERARCHY: Record<PlanId, number> = {
  free: 0,
  standard: 1,
  premium: 2,
  vip: 3,
};

export interface UseSubscriptionReturn {
  loading: boolean;
  error: string | null;
  plan: PlanId;
  planLabel: string;
  limits: PlanLimits | null;
  isFree: boolean;
  isPaid: boolean;
  isStandard: boolean;
  isPremium: boolean;
  isVip: boolean;
  isAtLeast: (requiredPlan: PlanId) => boolean;
  canDo: (featureKey: keyof PlanLimits) => boolean;
  refresh: (force?: boolean) => Promise<void>;
}

export const useSubscription = (): UseSubscriptionReturn => {
  const [data, setData] = useState<SubscriptionLimitsResponse | null>(
    cache.data,
  );
  const [loading, setLoading] = useState(!cache.data);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (force: boolean = false) => {
    const isFresh = cache.data && Date.now() - cache.timestamp < CACHE_TTL;
    if (isFresh && !force) {
      setData(cache.data);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetchSubscriptionLimits();
      cache = { data: res, timestamp: Date.now() };
      setData(res);
    } catch (e: any) {
      setError(
        e?.response?.data?.detail || "Impossible de charger votre abonnement.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const plan: PlanId = (data?.plan as PlanId) || "free";
  const limits = data?.limits || null;

  const isAtLeast = useCallback(
    (requiredPlan: PlanId) => {
      const current = PLAN_HIERARCHY[plan] ?? 0;
      const required = PLAN_HIERARCHY[requiredPlan] ?? 0;
      return current >= required;
    },
    [plan],
  );

  const canDo = useCallback(
    (featureKey: keyof PlanLimits) => {
      if (!limits) return false;
      const value = limits[featureKey];
      // Pour les limites numériques, on ne peut pas répondre juste avec le
      // booléen — on renvoie true si > 0 ou si null (illimité).
      if (typeof value === "number") return value > 0;
      if (value === null) return true; // illimité
      return Boolean(value);
    },
    [limits],
  );

  return {
    loading,
    error,
    plan,
    planLabel: data?.plan_label || "Free",
    limits,
    isFree: plan === "free",
    isPaid: plan !== "free",
    isStandard: plan === "standard",
    isPremium: plan === "premium",
    isVip: plan === "vip",
    isAtLeast,
    canDo,
    refresh: load,
  };
};

// Helper global pour invalider le cache (après un paiement, par exemple)
export const invalidateSubscriptionCache = () => {
  cache = { data: null, timestamp: 0 };
};
