import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View
} from "react-native";
import {
  acceptJob,
  clearSession,
  fetchMyOrders,
  fetchOpenJobs,
  Order,
  updateJobStatus
} from "./api";
import { shared } from "./styles";

type Screen = "jobs" | "active";

export function RiderApp(props: { onLogout: () => void }) {
  const [screen, setScreen] = useState<Screen>("jobs");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openJobs, setOpenJobs] = useState<Order[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  async function refreshJobs() {
    setLoading(true);
    setError("");
    try {
      const [open, mine] = await Promise.all([fetchOpenJobs(), fetchMyOrders()]);
      setOpenJobs(open.orders);
      const active = mine.orders.find((o) =>
        ["rider_assigned", "picked_up", "en_route"].includes(o.status)
      );
      setActiveOrder(active ?? null);
      setScreen(active ? "active" : "jobs");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshJobs();
  }, []);

  async function onAccept(orderId: string) {
    setLoading(true);
    setError("");
    try {
      const { order } = await acceptJob(orderId);
      setActiveOrder(order);
      setScreen("active");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not accept job");
    } finally {
      setLoading(false);
    }
  }

  async function onStatus(toStatus: "picked_up" | "en_route" | "delivered") {
    if (!activeOrder) return;
    setLoading(true);
    setError("");
    try {
      const { order } = await updateJobStatus(activeOrder.id, toStatus);
      setActiveOrder(order.status === "delivered" ? null : order);
      if (order.status === "delivered") {
        setScreen("jobs");
        await refreshJobs();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status update failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={shared.safe}>
      <ScrollView contentContainerStyle={shared.scroll}>
        <Text style={shared.brand}>LME Rider</Text>
        {error ? <Text style={shared.error}>{error}</Text> : null}

        {screen === "jobs" ? (
          <View style={shared.card}>
            <View style={shared.row}>
              <Text style={shared.title}>Open jobs</Text>
              <Pressable onPress={props.onLogout}>
                <Text style={shared.link}>Logout</Text>
              </Pressable>
            </View>
            {loading ? <ActivityIndicator color="#5AAD64" /> : null}
            {!openJobs.length && !loading ? (
              <Text style={shared.muted}>No jobs on the board right now.</Text>
            ) : null}
            {openJobs.map((job) => (
              <View key={job.id} style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#111D13" }}>
                <Text style={[shared.body, { fontFamily: "DMSans_500Medium", textTransform: "capitalize" }]}>
                  {job.category}
                </Text>
                <Text style={shared.muted}>{job.pickupAddress}</Text>
                <Text style={shared.muted}>→ {job.dropoffAddress}</Text>
                <Text style={[shared.muted, { color: "#C8A96E" }]}>
                  ₦{(job.deliveryFeeKobo / 100).toLocaleString("en-NG")} · You earn ₦
                  {((job.riderCommissionKobo ?? job.deliveryFeeKobo * 0.25) / 100).toLocaleString("en-NG")}
                </Text>
                <Pressable style={shared.btn} onPress={() => onAccept(job.id)} disabled={loading}>
                  <Text style={shared.btnText}>Accept</Text>
                </Pressable>
              </View>
            ))}
            <Pressable style={shared.btnSecondary} onPress={refreshJobs}>
              <Text style={shared.btnText}>Refresh</Text>
            </Pressable>
          </View>
        ) : null}

        {screen === "active" && activeOrder ? (
          <View style={shared.card}>
            <Text style={shared.title}>Active delivery</Text>
            <Text style={shared.muted}>
              {activeOrder.category} · {activeOrder.status}
            </Text>
            <Text style={shared.body}>{activeOrder.pickupAddress}</Text>
            <Text style={shared.body}>→ {activeOrder.dropoffAddress}</Text>
            {(["picked_up", "en_route", "delivered"] as const).map((status) => (
              <Pressable
                key={status}
                style={shared.btn}
                onPress={() => onStatus(status)}
                disabled={loading}
              >
                <Text style={shared.btnText}>Mark {status.replace("_", " ")}</Text>
              </Pressable>
            ))}
            <Pressable style={shared.btnSecondary} onPress={refreshJobs}>
              <Text style={shared.btnText}>Back to board</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
