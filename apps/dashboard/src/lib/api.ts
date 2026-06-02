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

export async function devExecutiveLogin(phone: string) {
  return apiFetch<{ user: unknown; token: string }>("/auth/dev-login", {
    method: "POST",
    body: JSON.stringify({
      phone,
      role: "executive",
      name: "LME Executive"
    })
  });
}

export async function fetchOrders() {
  return apiFetch<{ orders: Array<Record<string, unknown>> }>("/orders");
}
