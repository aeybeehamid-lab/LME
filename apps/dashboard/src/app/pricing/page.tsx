"use client";

import { FormEvent, useEffect, useState } from "react";
import { fetchPricing, formatNairaFromKobo, updatePricing, quoteDeliveryFee } from "../../lib/api";
import { Toast } from "../../components/Toast";

type PricingForm = {
  phoneMin: number;
  phoneMax: number;
  laptopMin: number;
  laptopMax: number;
  otherMin: number;
  otherMax: number;
  groceryBase: number;
  groceryPercent: number;
  foodBase: number;
  laundryBase: number;
  otherBase: number;
  urgentMin: number;
  urgentMax: number;
};

function koboToNaira(kobo: number) {
  return Math.round(kobo / 100);
}

function nairaToKobo(naira: number) {
  return Math.round(naira * 100);
}

export default function PricingPage() {
  const [form, setForm] = useState<PricingForm>({
    phoneMin: 800,
    phoneMax: 2000,
    laptopMin: 3000,
    laptopMax: 4000,
    otherMin: 1500,
    otherMax: 3500,
    groceryBase: 1200,
    groceryPercent: 5,
    foodBase: 1200,
    laundryBase: 1500,
    otherBase: 1200,
    urgentMin: 1.5,
    urgentMax: 2
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const { pricing } = await fetchPricing();
      setForm({
        phoneMin: koboToNaira(pricing.gadgets.phone.minKobo),
        phoneMax: koboToNaira(pricing.gadgets.phone.maxKobo),
        laptopMin: koboToNaira(pricing.gadgets.laptop.minKobo),
        laptopMax: koboToNaira(pricing.gadgets.laptop.maxKobo),
        otherMin: koboToNaira(pricing.gadgets.other.minKobo),
        otherMax: koboToNaira(pricing.gadgets.other.maxKobo),
        groceryBase: koboToNaira(pricing.grocery.baseKobo),
        groceryPercent: pricing.grocery.percentBps / 100,
        foodBase: koboToNaira(pricing.food.baseKobo),
        laundryBase: koboToNaira(pricing.laundry.baseKobo),
        otherBase: koboToNaira(pricing.other.baseKobo),
        urgentMin: pricing.urgent.minMultiplier,
        urgentMax: pricing.urgent.maxMultiplier
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load pricing");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function refreshPreview() {
    try {
      const phone = await quoteDeliveryFee({
        category: "gadgets",
        gadgetType: "phone"
      });
      const grocery = await quoteDeliveryFee({
        category: "grocery",
        orderValueKobo: 5_000_000
      });
      setPreview(
        `Phone (mid): ${formatNairaFromKobo(phone.deliveryFeeKobo)} · Grocery (₦50k order): ${formatNairaFromKobo(grocery.deliveryFeeKobo)}`
      );
    } catch {
      setPreview("");
    }
  }

  useEffect(() => {
    if (!loading) void refreshPreview();
  }, [loading, form]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await updatePricing({
        gadgets: {
          phone: { minKobo: nairaToKobo(form.phoneMin), maxKobo: nairaToKobo(form.phoneMax) },
          laptop: { minKobo: nairaToKobo(form.laptopMin), maxKobo: nairaToKobo(form.laptopMax) },
          other: { minKobo: nairaToKobo(form.otherMin), maxKobo: nairaToKobo(form.otherMax) }
        },
        grocery: {
          baseKobo: nairaToKobo(form.groceryBase),
          percentBps: Math.round(form.groceryPercent * 100)
        },
        food: { baseKobo: nairaToKobo(form.foodBase) },
        laundry: { baseKobo: nairaToKobo(form.laundryBase) },
        other: { baseKobo: nairaToKobo(form.otherBase) },
        urgent: { minMultiplier: form.urgentMin, maxMultiplier: form.urgentMax }
      });
      setMessage("Pricing saved. Customer apps will use these rates on next booking.");
      await refreshPreview();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save pricing");
    } finally {
      setSaving(false);
    }
  }

  function numField(
    label: string,
    key: keyof PricingForm,
    step = 1
  ) {
    return (
      <>
        <label>{label}</label>
        <input
          type="number"
          step={step}
          value={form[key]}
          onChange={(e) =>
            setForm((f) => ({ ...f, [key]: Number(e.target.value) }))
          }
          required
        />
      </>
    );
  }

  if (loading) {
    return <p className="muted">Loading pricing...</p>;
  }

  return (
    <section>
      <h1>Delivery pricing</h1>
      <p className="muted">
        Adjust fees here — changes apply to new customer bookings immediately. Admin
        manual orders can still use custom amounts.
      </p>

      <form onSubmit={onSubmit} className="card" style={{ marginTop: 16 }}>
        <h3>Gadgets (NGN min – max)</h3>
        <div className="grid">
          <div>{numField("Phone min", "phoneMin")}</div>
          <div>{numField("Phone max", "phoneMax")}</div>
          <div>{numField("Laptop min", "laptopMin")}</div>
          <div>{numField("Laptop max", "laptopMax")}</div>
          <div>{numField("Other gadget min", "otherMin")}</div>
          <div>{numField("Other gadget max", "otherMax")}</div>
        </div>

        <h3 style={{ marginTop: 20 }}>Grocery</h3>
        <div className="grid">
          <div>{numField("Base fee (NGN)", "groceryBase")}</div>
          <div>{numField("Percent of order value", "groceryPercent", 0.1)}</div>
        </div>

        <h3 style={{ marginTop: 20 }}>Flat categories (NGN)</h3>
        <div className="grid">
          <div>{numField("Food base", "foodBase")}</div>
          <div>{numField("Laundry base", "laundryBase")}</div>
          <div>{numField("Other base", "otherBase")}</div>
        </div>

        <h3 style={{ marginTop: 20 }}>Urgent delivery multiplier</h3>
        <div className="grid">
          <div>{numField("Min (e.g. 1.5)", "urgentMin", 0.1)}</div>
          <div>{numField("Max (e.g. 2.0)", "urgentMax", 0.1)}</div>
        </div>

        {preview ? <p className="muted" style={{ marginTop: 16 }}>Live preview: {preview}</p> : null}

        {message ? (
          <Toast variant="success" onDismiss={() => setMessage("")}>
            {message}
          </Toast>
        ) : null}
        {error ? (
          <Toast variant="error" onDismiss={() => setError("")}>
            {error}
          </Toast>
        ) : null}

        <button className="btn" type="submit" disabled={saving} style={{ marginTop: 16 }}>
          {saving ? "Saving..." : "Save pricing"}
        </button>
      </form>
    </section>
  );
}
