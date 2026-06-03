import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

const TOKEN_KEY = "lme_token";

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
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

export async function devRiderLogin(phone: string, name?: string) {
  return apiFetch<{ token: string }>("/auth/dev-login", {
    method: "POST",
    body: JSON.stringify({ phone, role: "rider", name: name ?? "LME Rider" })
  });
}

export type JobOrder = {
  id: string;
  category: string;
  status: string;
  deliveryFeeKobo: number;
  pickupAddress: string;
  dropoffAddress: string;
  riderCommissionKobo?: number;
};

export async function fetchOpenJobs() {
  return apiFetch<{ orders: JobOrder[] }>("/orders/open-jobs");
}

export async function fetchMyOrders() {
  return apiFetch<{ orders: JobOrder[] }>("/orders");
}

export async function acceptJob(orderId: string) {
  return apiFetch<{ order: JobOrder }>(`/orders/${orderId}/status`, {
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
  return apiFetch<{ order: JobOrder }>(`/orders/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ toStatus, reason: `Rider marked ${toStatus}` })
  });
}
