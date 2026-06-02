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

export async function fetchOrders(status?: string) {
  const query = status && status !== "all" ? `?status=${encodeURIComponent(status)}` : "";
  return apiFetch<{ orders: Array<Record<string, unknown>> }>(`/orders${query}`);
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
