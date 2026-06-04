import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View
} from "react-native";
import { createOrder, fetchMyOrders, Order } from "./api";
import { completeOrderPayment } from "./paystack";
import { shared } from "./styles";

type Screen = "book" | "orders" | "track";

const categories = ["gadgets", "food", "grocery", "laundry", "other"] as const;

const paidStatuses = new Set([
  "payment_confirmed",
  "posted_to_job_board",
  "rider_assigned",
  "picked_up",
  "en_route",
  "delivered"
]);

export function CustomerApp(props: { onLogout: () => void }) {
  const [screen, setScreen] = useState<Screen>("book");
  const [loading, setLoading] = useState(false);
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [form, setForm] = useState({
    category: "gadgets" as (typeof categories)[number],
    feeNaira: "1200",
    pickup: "",
    dropoff: "",
    description: ""
  });

  async function loadOrders() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchMyOrders();
      setOrders(data.orders);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadOrders();
  }, []);

  async function payForOrder(order: Order) {
    setPayingOrderId(order.id);
    setError("");
    setMessage("");
    try {
      setMessage("Opening Paystack checkout...");
      const result = await completeOrderPayment(order.id, order.deliveryFeeKobo);
      setMessage(
        result.mode === "paystack"
          ? "Payment confirmed. Your order is on the rider job board."
          : "Payment confirmed (dev). Your order is on the job board."
      );
      await loadOrders();
      const refreshed = (await fetchMyOrders()).orders.find((o) => o.id === order.id);
      if (refreshed) setSelectedOrder(refreshed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setPayingOrderId(null);
    }
  }

  async function onBook() {
    if (!form.pickup.trim() || !form.dropoff.trim()) {
      setError("Pickup and dropoff addresses are required.");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const fee = Math.round(Number(form.feeNaira) * 100);
      if (!Number.isFinite(fee) || fee <= 0) {
        throw new Error("Enter a valid delivery fee in Naira.");
      }
      const { order } = await createOrder({
        category: form.category,
        deliveryFeeKobo: fee,
        pickupAddress: form.pickup.trim(),
        dropoffAddress: form.dropoff.trim(),
        itemDescription: form.description.trim() || undefined
      });
      setMessage("Order created. Opening payment...");
      const result = await completeOrderPayment(order.id, order.deliveryFeeKobo);
      setMessage(
        result.mode === "paystack"
          ? "Booked and paid. Your order is on the rider job board."
          : "Booked and paid (dev). Your order is on the job board."
      );
      setForm((f) => ({ ...f, pickup: "", dropoff: "", description: "" }));
      await loadOrders();
      setScreen("orders");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={shared.safe}>
      <ScrollView contentContainerStyle={shared.scroll}>
        <Text style={shared.brand}>LME</Text>
        <View style={shared.roleRow}>
          {(["book", "orders", "track"] as const).map((tab) => (
            <Pressable
              key={tab}
              style={[shared.roleChip, screen === tab && shared.roleChipActive]}
              onPress={() => {
                setScreen(tab);
                setSelectedOrder(null);
              }}
            >
              <Text style={shared.roleChipText}>{tab}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable onPress={props.onLogout} style={{ marginBottom: 8 }}>
          <Text style={shared.link}>Logout</Text>
        </Pressable>

        {error ? <Text style={shared.error}>{error}</Text> : null}
        {message ? <Text style={[shared.muted, { color: "#5AAD64" }]}>{message}</Text> : null}

        {screen === "book" ? (
          <View style={shared.card}>
            <Text style={shared.title}>Book a delivery</Text>
            <Text style={shared.muted}>
              You pay upfront via Paystack before the order goes to riders.
            </Text>
            <Text style={shared.label}>Category</Text>
            <View style={[shared.roleRow, { flexWrap: "wrap" }]}>
              {categories.map((c) => (
                <Pressable
                  key={c}
                  style={[
                    shared.roleChip,
                    form.category === c && shared.roleChipActive,
                    { flex: undefined, minWidth: "45%" }
                  ]}
                  onPress={() => setForm((f) => ({ ...f, category: c }))}
                >
                  <Text style={shared.roleChipText}>{c}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={shared.label}>Delivery fee (NGN)</Text>
            <TextInput
              style={shared.input}
              value={form.feeNaira}
              onChangeText={(v: string) => setForm((f) => ({ ...f, feeNaira: v }))}
              keyboardType="numeric"
            />
            <Text style={shared.label}>Pickup address</Text>
            <TextInput
              style={shared.input}
              value={form.pickup}
              onChangeText={(v: string) => setForm((f) => ({ ...f, pickup: v }))}
            />
            <Text style={shared.label}>Dropoff address</Text>
            <TextInput
              style={shared.input}
              value={form.dropoff}
              onChangeText={(v: string) => setForm((f) => ({ ...f, dropoff: v }))}
            />
            <Text style={shared.label}>Item description (optional)</Text>
            <TextInput
              style={shared.input}
              value={form.description}
              onChangeText={(v: string) => setForm((f) => ({ ...f, description: v }))}
            />
            <Pressable style={shared.btn} onPress={onBook} disabled={loading || Boolean(payingOrderId)}>
              <Text style={shared.btnText}>
                {loading ? "Working..." : "Book & pay with Paystack"}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {screen === "orders" ? (
          <View style={shared.card}>
            <Text style={shared.title}>My orders</Text>
            {loading ? <ActivityIndicator color="#5AAD64" /> : null}
            {!orders.length && !loading ? (
              <Text style={shared.muted}>No orders yet. Book your first delivery.</Text>
            ) : null}
            {orders.map((o) => {
              const needsPayment =
                o.status === "created" || o.status === "payment_pending";
              const isPaying = payingOrderId === o.id;
              return (
                <View
                  key={o.id}
                  style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTopWidth: 1,
                    borderTopColor: "#111D13"
                  }}
                >
                  <Pressable
                    onPress={() => {
                      setSelectedOrder(o);
                      setScreen("track");
                    }}
                  >
                    <Text style={shared.body}>
                      {o.category} · {o.status}
                    </Text>
                    <Text style={shared.muted}>
                      ₦{(o.deliveryFeeKobo / 100).toLocaleString("en-NG")}
                    </Text>
                  </Pressable>
                  {needsPayment ? (
                    <Pressable
                      style={[shared.btn, { marginTop: 8 }]}
                      disabled={isPaying}
                      onPress={() => void payForOrder(o)}
                    >
                      <Text style={shared.btnText}>
                        {isPaying ? "Paying..." : "Pay with Paystack"}
                      </Text>
                    </Pressable>
                  ) : null}
                  {paidStatuses.has(o.status) ? (
                    <Text style={[shared.muted, { marginTop: 4 }]}>Paid · on job board or in progress</Text>
                  ) : null}
                </View>
              );
            })}
            <Pressable style={shared.btnSecondary} onPress={loadOrders}>
              <Text style={shared.btnText}>Refresh</Text>
            </Pressable>
          </View>
        ) : null}

        {screen === "track" && selectedOrder ? (
          <View style={shared.card}>
            <Text style={shared.title}>Order status</Text>
            <Text style={shared.muted}>ID {selectedOrder.id.slice(0, 8)}...</Text>
            <Text style={shared.body}>Status: {selectedOrder.status}</Text>
            {selectedOrder.riderName ? (
              <Text style={shared.body}>Rider: {selectedOrder.riderName}</Text>
            ) : null}
            <Text style={shared.body}>{selectedOrder.pickupAddress}</Text>
            <Text style={shared.body}>→ {selectedOrder.dropoffAddress}</Text>
            {selectedOrder.status === "created" ||
            selectedOrder.status === "payment_pending" ? (
              <Pressable
                style={shared.btn}
                disabled={payingOrderId === selectedOrder.id}
                onPress={() => void payForOrder(selectedOrder)}
              >
                <Text style={shared.btnText}>
                  {payingOrderId === selectedOrder.id
                    ? "Paying..."
                    : "Pay with Paystack"}
                </Text>
              </Pressable>
            ) : null}
            <Pressable style={shared.btnSecondary} onPress={() => setScreen("orders")}>
              <Text style={shared.btnText}>Back to orders</Text>
            </Pressable>
          </View>
        ) : null}

        {screen === "track" && !selectedOrder ? (
          <Text style={shared.muted}>Select an order from My orders to track.</Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
