const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("lme_token");
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Request failed");
  }
  return data as T;
}

export async function devAdminLogin(phone: string) {
  return apiFetch<{ user: unknown; token: string }>("/auth/dev-login", {
    method: "POST",
    body: JSON.stringify({
      phone,
      role: "executive",
      name: "LME Admin"
    })
  });
}

export async function firebaseAdminLogin(idToken: string) {
  return apiFetch<{ user: unknown; token: string }>("/auth/firebase", {
    method: "POST",
    body: JSON.stringify({
      idToken,
      role: "executive"
    })
  });
}

export async function fetchOrders(status?: string) {
  const query = status && status !== "all" ? `?status=${encodeURIComponent(status)}` : "";
  return apiFetch<{ orders: Array<Record<string, unknown>> }>(`/orders${query}`);
}

export async function fetchOrderById(orderId: string) {
  return apiFetch<{ order: Record<string, unknown> }>(`/orders/${orderId}`);
}

export async function createOrder(input: {
  category: "gadgets" | "food" | "grocery" | "laundry" | "other";
  deliveryFeeKobo: number;
  urgentMultiplier?: number;
  pickupAddress: string;
  dropoffAddress: string;
  itemDescription?: string;
}) {
  return apiFetch<{ order: Record<string, unknown> }>("/orders", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function updateOrderStatus(
  orderId: string,
  input: {
    toStatus:
      | "payment_pending"
      | "payment_confirmed"
      | "posted_to_job_board"
      | "rider_assigned"
      | "picked_up"
      | "en_route"
      | "delivered"
      | "escalated"
      | "cancelled"
      | "refunded";
    reason?: string;
    riderId?: string;
  }
) {
  return apiFetch<{ order: Record<string, unknown> }>(`/orders/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export async function fetchAutomationStatus() {
  return apiFetch<{
    automation: {
      lastRunAt: string | null;
      lastSuccessAt: string | null;
      lastError: string | null;
      escalatedInLastRun: number;
      refundedInLastRun: number;
    };
  }>("/ops/automation-status");
}

export async function fetchRiders() {
  return apiFetch<{
    riders: Array<{
      id: string;
      name: string;
      phone: string;
      bikeId?: string;
      isOnline: boolean;
    }>;
  }>("/auth/riders");
}

export async function fetchRiderAdminList() {
  return apiFetch<{
    riders: Array<{
      id: string;
      name: string;
      phone: string;
      bikeId?: string;
      isOnline: boolean;
      isActive: boolean;
      joinDate: string;
      strikeCount: number;
    }>;
  }>("/riders");
}

export async function createRider(input: { phone: string; name: string; bikeId?: string }) {
  return apiFetch<{ rider: Record<string, unknown> }>("/riders", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function updateRider(
  riderUserId: string,
  input: { bikeId?: string | null; isOnline?: boolean; isActive?: boolean; name?: string | null }
) {
  return apiFetch<{ rider: Record<string, unknown> }>(`/riders/${riderUserId}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export function formatNairaFromKobo(kobo: number): string {
  return (kobo / 100).toLocaleString("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0
  });
}

export async function fetchFinanceSummary() {
  return apiFetch<{
    summary: {
      moneyInKobo: number;
      riderCommissionsKobo: number;
      refundedKobo: number;
      netKobo: number;
      lmeShareFromDeliveredKobo: number;
      deliveredCount: number;
      payments: { pending: number; success: number };
      ordersByStatus: Record<string, number>;
      activeOrders: number;
    };
  }>("/finance/summary");
}

export async function fetchFinanceTransactions(limit = 50) {
  return apiFetch<{
    transactions: Array<{
      id: string;
      orderId: string;
      paystackReference: string;
      amountKobo: number;
      status: string;
      createdAt: string;
    }>;
  }>(`/finance/transactions?limit=${limit}`);
}

export async function initializePayment(input: {
  orderId: string;
  amountKobo: number;
  idempotencyKey: string;
  customerEmail?: string;
}) {
  return apiFetch<{
    payment: {
      authorizationUrl?: string | null;
      paystackLive?: boolean;
      paystackReference?: string;
    };
  }>("/payments/initialize", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function devConfirmPayment(orderId: string) {
  return apiFetch<{ ok: boolean }>("/payments/dev-confirm", {
    method: "POST",
    body: JSON.stringify({ orderId })
  });
}

export async function fetchRiderStats(riderUserId: string) {
  return apiFetch<{
    stats: {
      riderUserId: string;
      deliveryCount: number;
      totalEarningsKobo: number;
      totalDeliveryFeesKobo: number;
    };
  }>(`/finance/riders/${riderUserId}/stats`);
}

export async function fetchOrderEvents(orderId: string) {
  return apiFetch<{
    events: Array<{
      id: string;
      orderId: string;
      fromStatus?: string;
      toStatus: string;
      actorUserId?: string;
      reason?: string;
      createdAt: string;
    }>;
  }>(`/orders/${orderId}/events`);
}

export type PricingConfig = {
  gadgets: {
    phone: { minKobo: number; maxKobo: number };
    laptop: { minKobo: number; maxKobo: number };
    other: { minKobo: number; maxKobo: number };
  };
  grocery: { baseKobo: number; percentBps: number };
  food: { baseKobo: number };
  laundry: { baseKobo: number };
  other: { baseKobo: number };
  urgent: { minMultiplier: number; maxMultiplier: number };
};

export async function fetchPricing() {
  return apiFetch<{ pricing: PricingConfig }>("/pricing");
}

export async function updatePricing(patch: Partial<PricingConfig>) {
  return apiFetch<{ pricing: PricingConfig }>("/pricing", {
    method: "PATCH",
    body: JSON.stringify(patch)
  });
}

export async function quoteDeliveryFee(input: {
  category: string;
  gadgetType?: string;
  orderValueKobo?: number;
  urgent?: boolean;
}) {
  return apiFetch<{ deliveryFeeKobo: number; urgentMultiplier: number }>(
    "/pricing/quote",
    {
      method: "POST",
      body: JSON.stringify(input)
    }
  );
}
