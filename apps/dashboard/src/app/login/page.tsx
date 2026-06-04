"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ConfirmationResult,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from "firebase/auth";
import { devAdminLogin, firebaseAdminLogin } from "../../lib/api";
import { getFirebaseAuth, isFirebaseConfigured } from "../../lib/firebase";
import { Toast } from "../../components/Toast";

const firebaseEnabled = isFirebaseConfigured();

export default function LoginPage() {
  const router = useRouter();
  const recaptchaRef = useRef<HTMLDivElement | null>(null);
  const verifierRef = useRef<RecaptchaVerifier | null>(null);
  const confirmationRef = useRef<ConfirmationResult | null>(null);

  const [phone, setPhone] = useState("+234");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [useDevLogin, setUseDevLogin] = useState(!firebaseEnabled);
  const [error, setError] = useState("");
  const [info, setInfo] = useState(
    firebaseEnabled
      ? "Sign in with an SMS code sent to your executive phone."
      : "Firebase is not configured — using dev login."
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!firebaseEnabled || useDevLogin || !recaptchaRef.current) return;

    const auth = getFirebaseAuth();
    verifierRef.current = new RecaptchaVerifier(auth, recaptchaRef.current, {
      size: "invisible"
    });

    return () => {
      verifierRef.current?.clear();
      verifierRef.current = null;
    };
  }, [useDevLogin]);

  async function onSendOtp(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");
    try {
      const auth = getFirebaseAuth();
      if (!verifierRef.current) {
        throw new Error("Security check is still loading. Try again in a moment.");
      }
      confirmationRef.current = await signInWithPhoneNumber(
        auth,
        phone,
        verifierRef.current
      );
      setOtpSent(true);
      setInfo("Verification code sent. Check your SMS.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code");
    } finally {
      setLoading(false);
    }
  }

  async function onVerifyOtp(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");
    try {
      if (!confirmationRef.current) {
        throw new Error("Send a verification code first.");
      }
      const credential = await confirmationRef.current.confirm(otp);
      const idToken = await credential.user.getIdToken();
      const result = await firebaseAdminLogin(idToken);
      localStorage.setItem("lme_token", result.token);
      router.push("/orders");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  async function onDevSubmit(event: FormEvent) {
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
        {firebaseEnabled && !useDevLogin
          ? "Phone OTP via Firebase (PRD). Your number must already be registered as an executive."
          : "Dev login for local testing without Firebase."}
      </p>

      {firebaseEnabled ? (
        <p style={{ marginBottom: 12 }}>
          <button
            type="button"
            className="btn-ghost btn-sm"
            onClick={() => {
              setUseDevLogin((v) => !v);
              setOtpSent(false);
              setOtp("");
              setInfo(
                useDevLogin
                  ? "Sign in with an SMS code sent to your executive phone."
                  : "Dev login for local testing."
              );
            }}
          >
            {useDevLogin ? "Use Firebase OTP instead" : "Use dev login instead"}
          </button>
        </p>
      ) : null}

      {!useDevLogin && firebaseEnabled ? (
        <>
          <div ref={recaptchaRef} id="recaptcha-container" />
          <form onSubmit={otpSent ? onVerifyOtp : onSendOtp}>
            <label htmlFor="phone">Phone number</label>
            <input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              disabled={otpSent}
            />
            {otpSent ? (
              <>
                <label htmlFor="otp" style={{ marginTop: 12 }}>
                  Verification code
                </label>
                <input
                  id="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="6-digit SMS code"
                />
              </>
            ) : null}
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
              {loading
                ? "Please wait..."
                : otpSent
                  ? "Verify & sign in"
                  : "Send verification code"}
            </button>
          </form>
        </>
      ) : (
        <form onSubmit={onDevSubmit}>
          <label htmlFor="phone-dev">Phone number</label>
          <input
            id="phone-dev"
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
            {loading ? "Signing in..." : "Sign in (dev)"}
          </button>
        </form>
      )}
    </section>
  );
}
