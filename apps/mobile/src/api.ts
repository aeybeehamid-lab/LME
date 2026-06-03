import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

const TOKEN_KEY = "lme_token";
const ROLE_KEY = "lme_role";

export type AppRole = "customer" | "rider";

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function getStoredRole(): Promise<AppRole | null> {
  const role = await AsyncStorage.getItem(ROLE_KEY);
  return role === "customer" || role === "rider" ? role : null;
}

export async function setSession(token: string, role: AppRole): Promise<void> {
  await AsyncStorage.multiSet([
    [TOKEN_KEY, token],
    [ROLE_KEY, role]
  ]);
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.multiRemove([TOKEN_KEY, ROLE_KEY]);
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message ?? data?.message ?? "Request failed");
  }
  return data as T;
}

export async function devLogin(phone: string, role: AppRole, name?: string) {
  return apiFetch<{ token: string }>("/auth/dev-login", {
    method: "POST",
    body: JSON.stringify({
      phone,
      role,
      name: name ?? (role === "rider" ? "LME Rider" : "LME Customer")
    })
  });
}

export type Order = {
  id: string;
  category: string;
  status: string;
  deliveryFeeKobo: number;
  pickupAddress: string;
  dropoffAddress: string;
  itemDescription?: string;
  riderCommissionKobo?: number;
  riderName?: string;
};

export async function fetchOpenJobs() {
  return apiFetch<{ orders: Order[] }>("/orders/open-jobs");
}

export async function fetchMyOrders() {
  return apiFetch<{ orders: Order[] }>("/orders");
}

export async function createOrder(input: {
  category: "gadgets" | "food" | "grocery" | "laundry" | "other";
  deliveryFeeKobo: number;
  pickupAddress: string;
  dropoffAddress: string;
  itemDescription?: string;
}) {
  return apiFetch<{ order: Order }>("/orders", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function initializePayment(orderId: string, amountKobo: number) {
  return apiFetch<{
    payment: { authorizationUrl?: string | null; paystackLive?: boolean };
  }>("/payments/initialize", {
    method: "POST",
    body: JSON.stringify({
      orderId,
      amountKobo,
      idempotencyKey: `init:${orderId}:${Date.now()}`
    })
  });
}

export async function devConfirmPayment(orderId: string) {
  return apiFetch<{ ok: boolean }>("/payments/dev-confirm", {
    method: "POST",
    body: JSON.stringify({ orderId })
  });
}

export async function acceptJob(orderId: string) {
  return apiFetch<{ order: Order }>(`/orders/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify({
      toStatus: "rider_assigned",
      reason: "Accepted from rider app"
    })
  });
}

export async function updateJobStatus(
  orderId: string,
  toStatus: "picked_up" | "en_route" | "delivered"
) {
  return apiFetch<{ order: Order }>(`/orders/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ toStatus, reason: `Rider marked ${toStatus}` })
  });
}
