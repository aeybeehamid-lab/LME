"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { devAdminLogin } from "../../lib/api";
import { Toast } from "../../components/Toast";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("+234");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("Use dev login while we build Sprint 1.");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");
    try {
      const result = await devAdminLogin(phone);
      localStorage.setItem("lme_token", result.token);
      router.push("/orders");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card" style={{ maxWidth: 420 }}>
      <h1>Admin Login</h1>
      <p className="muted">
        Dev login for Sprint 1. Firebase OTP will replace this in production.
      </p>
      <form onSubmit={onSubmit}>
        <label htmlFor="phone">Phone number</label>
        <input
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        {info ? (
          <Toast variant="info" onDismiss={() => setInfo("")}>
            {info}
          </Toast>
        ) : null}
        {error ? (
          <Toast variant="error" onDismiss={() => setError("")}>
            {error}
          </Toast>
        ) : null}
        <button className="btn" type="submit" disabled={loading} style={{ marginTop: 16 }}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </section>
  );
}
