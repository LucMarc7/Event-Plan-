// src/api/payments.ts
import api from "./client";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════
export type PlanId = "standard" | "premium" | "vip";

export type Telecom = "OM" | "MP" | "AT" | "AF";

export interface InitiatePaymentPayload {
  plan_id: PlanId;
  phone: string;
  telecom?: Telecom;
}

export interface InitiatePaymentResponse {
  session_id: string;
  status: number; // 200 or 102
  message: string;
}

export type PaymentStatus = "pending" | "success" | "failed";

export interface PaymentStatusResponse {
  status: PaymentStatus;
  transaction_id?: string | null;
  session_id: string;
  amount?: string | null;
  currency?: string;
  updated_at?: string;
}

// ═══════════════════════════════════════════════════════════════
// MÉTADONNÉES DES PLANS (côté mobile)
// ═══════════════════════════════════════════════════════════════
export const PLANS: {
  id: PlanId;
  name: string;
  price: number;
  currency: string;
  period: string;
  description: string;
  features: string[];
  color: string;
  icon: string;
  popular?: boolean;
}[] = [
  {
    id: "standard",
    name: "Standard",
    price: 19.9,
    currency: "USD",
    period: "/mois",
    description: "Pour les organisateurs occasionnels",
    features: [
      "Création d'événements illimitée",
      "Gestion des invités",
      "QR codes d'invitation",
      "Support par email",
    ],
    color: "#4F46E5",
    icon: "star", // ✅ Feather valide
  },
  {
    id: "premium",
    name: "Premium",
    price: 29.9,
    currency: "USD",
    period: "/mois",
    description: "Pour les organisateurs réguliers",
    features: [
      "Tout Standard +",
      "Thèmes personnalisés",
      "Contrôleurs d'accès",
      "Support prioritaire",
      "Badge Premium",
    ],
    color: "#F59E0B",
    icon: "award", // ✅ Feather valide
    popular: true,
  },
  {
    id: "vip",
    name: "VIP",
    price: 59.9,
    currency: "USD",
    period: "/mois",
    description: "Pour les professionnels",
    features: [
      "Tout Premium +",
      "Accès VIP & concierge",
      "Invitations exclusives",
      "Cashback 5%",
    ],
    color: "#8B5CF6",
    icon: "zap", // ✅ Feather valide
  },
];

// ═══════════════════════════════════════════════════════════════
// OPÉRATEURS (RDC)
// ═══════════════════════════════════════════════════════════════
export const TELECOMS: {
  id: Telecom;
  name: string;
  color: string;
  short: string;
}[] = [
  { id: "OM", name: "Orange Money", color: "#FF7900", short: "OM" },
  { id: "MP", name: "M-Pesa", color: "#E30613", short: "MP" },
  { id: "AT", name: "Airtel Money", color: "#ED1C24", short: "AT" },
  { id: "AF", name: "Afrimoney", color: "#009FE3", short: "AF" },
];

// ═══════════════════════════════════════════════════════════════
// API
// ═══════════════════════════════════════════════════════════════

/**
 * Lance un paiement SerdiPay pour un plan d'abonnement.
 * Le backend envoie une requête USSD sur le téléphone de l'utilisateur.
 */
export const initiatePayment = async (
  payload: InitiatePaymentPayload,
): Promise<InitiatePaymentResponse> => {
  const response = await api.post("/payments/api/payments/initiate/", payload);
  return response.data;
};

/**
 * Vérifie le statut d'une transaction SerdiPay.
 * À appeler en polling jusqu'à `success` ou `failed`.
 */
export const getPaymentStatus = async (
  sessionId: string,
): Promise<PaymentStatusResponse> => {
  const response = await api.get(
    `/payments/api/payments/serdipay/status/${sessionId}/`,
  );
  return response.data;
};

/**
 * Helper : polling automatique avec timeout.
 * Retourne le statut final ou throw si timeout.
 */
export const pollPaymentStatus = async (
  sessionId: string,
  options: {
    intervalMs?: number;
    timeoutMs?: number;
    onUpdate?: (status: PaymentStatusResponse) => void;
  } = {},
): Promise<PaymentStatusResponse> => {
  const {
    intervalMs = 3000,
    timeoutMs = 5 * 60 * 1000, // 5 minutes
    onUpdate,
  } = options;

  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const status = await getPaymentStatus(sessionId);
      onUpdate?.(status);

      if (status.status === "success" || status.status === "failed") {
        return status;
      }
    } catch (err) {
      console.warn("[Payment poll] Erreur temporaire:", err);
      // On continue à poller même en cas d'erreur réseau ponctuelle
    }

    await new Promise((r) => setTimeout(r, intervalMs));
  }

  throw new Error("TIMEOUT");
};
