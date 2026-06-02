"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { devExecutiveLogin } from "../../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("+234");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await devExecutiveLogin(phone);
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
      <h1>Executive Login</h1>
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
        {error ? <p style={{ color: "#ff8f8f" }}>{error}</p> : null}
        <button className="btn" type="submit" disabled={loading} style={{ marginTop: 16 }}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </section>
  );
}
