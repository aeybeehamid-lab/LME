import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  useFonts,
  DMSans_400Regular,
  DMSans_500Medium
} from "@expo-google-fonts/dm-sans";
import {
  CormorantGaramond_500Medium,
  CormorantGaramond_500Medium_Italic
} from "@expo-google-fonts/cormorant-garamond";
import {
  acceptJob,
  clearToken,
  devRiderLogin,
  fetchMyOrders,
  fetchOpenJobs,
  getToken,
  JobOrder,
  setToken,
  updateJobStatus
} from "./src/api";
import { colors, fonts } from "./src/theme";

type Screen = "login" | "jobs" | "active";

export default function App() {
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    CormorantGaramond_500Medium,
    CormorantGaramond_500Medium_Italic
  });

  const [screen, setScreen] = useState<Screen>("login");
  const [phone, setPhone] = useState("+234");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openJobs, setOpenJobs] = useState<JobOrder[]>([]);
  const [activeOrder, setActiveOrder] = useState<JobOrder | null>(null);

  useEffect(() => {
    getToken().then((token) => {
      if (token) {
        setScreen("jobs");
        void refreshJobs();
      }
    });
  }, []);

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

  async function onLogin() {
    setLoading(true);
    setError("");
    try {
      const { token } = await devRiderLogin(phone);
      await setToken(token);
      await refreshJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

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

  async function onLogout() {
    await clearToken();
    setScreen("login");
    setOpenJobs([]);
    setActiveOrder(null);
  }

  if (!fontsLoaded) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.greenAccent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.brand}>LME Rider</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {screen === "login" ? (
          <View style={styles.card}>
            <Text style={styles.title}>Sign in</Text>
            <Text style={styles.muted}>Dev login — use a rider phone from Admin.</Text>
            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <Pressable style={styles.btn} onPress={onLogin} disabled={loading}>
              <Text style={styles.btnText}>{loading ? "..." : "Sign in"}</Text>
            </Pressable>
          </View>
        ) : null}

        {screen === "jobs" ? (
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.title}>Open jobs</Text>
              <Pressable onPress={onLogout}>
                <Text style={styles.link}>Logout</Text>
              </Pressable>
            </View>
            {loading ? <ActivityIndicator color={colors.greenAccent} /> : null}
            {!openJobs.length && !loading ? (
              <Text style={styles.muted}>No jobs on the board right now.</Text>
            ) : null}
            {openJobs.map((job) => (
              <View key={job.id} style={styles.jobCard}>
                <Text style={styles.jobTitle}>{job.category}</Text>
                <Text style={styles.muted}>{job.pickupAddress}</Text>
                <Text style={styles.muted}>→ {job.dropoffAddress}</Text>
                <Text style={styles.fee}>
                  ₦{(job.deliveryFeeKobo / 100).toLocaleString("en-NG")} · You earn ₦
                  {((job.riderCommissionKobo ?? job.deliveryFeeKobo * 0.25) / 100).toLocaleString(
                    "en-NG"
                  )}
                </Text>
                <Pressable style={styles.btn} onPress={() => onAccept(job.id)} disabled={loading}>
                  <Text style={styles.btnText}>Accept</Text>
                </Pressable>
              </View>
            ))}
            <Pressable style={styles.btnSecondary} onPress={refreshJobs}>
              <Text style={styles.btnText}>Refresh</Text>
            </Pressable>
          </View>
        ) : null}

        {screen === "active" && activeOrder ? (
          <View style={styles.card}>
            <Text style={styles.title}>Active delivery</Text>
            <Text style={styles.muted}>{activeOrder.category} · {activeOrder.status}</Text>
            <Text style={styles.body}>{activeOrder.pickupAddress}</Text>
            <Text style={styles.body}>→ {activeOrder.dropoffAddress}</Text>
            {(["picked_up", "en_route", "delivered"] as const).map((status) => (
              <Pressable
                key={status}
                style={styles.btn}
                onPress={() => onStatus(status)}
                disabled={loading}
              >
                <Text style={styles.btnText}>Mark {status.replace("_", " ")}</Text>
              </Pressable>
            ))}
            <Pressable style={styles.btnSecondary} onPress={refreshJobs}>
              <Text style={styles.btnText}>Back to board</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  brand: {
    fontFamily: fonts.headingItalic,
    fontSize: 32,
    color: colors.text,
    marginBottom: 16
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 24,
    color: colors.text,
    marginBottom: 8
  },
  body: { fontFamily: fonts.body, color: colors.text, marginBottom: 4 },
  muted: { fontFamily: fonts.body, color: colors.muted, marginBottom: 6 },
  label: { fontFamily: fonts.bodyMedium, color: colors.muted, marginTop: 8 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.green,
    padding: 16,
    marginBottom: 16
  },
  jobCard: {
    borderTopWidth: 1,
    borderTopColor: colors.surface,
    paddingTop: 12,
    marginTop: 12
  },
  jobTitle: {
    fontFamily: fonts.bodyMedium,
    color: colors.text,
    fontSize: 16,
    textTransform: "capitalize"
  },
  fee: { fontFamily: fonts.bodyMedium, color: colors.gold, marginVertical: 8 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.green,
    borderRadius: 10,
    color: colors.text,
    padding: 12,
    marginBottom: 12,
    fontFamily: fonts.body
  },
  btn: {
    backgroundColor: colors.green,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8
  },
  btnSecondary: {
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.green
  },
  btnText: { fontFamily: fonts.bodyMedium, color: colors.text },
  link: { fontFamily: fonts.body, color: colors.greenAccent },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  error: { fontFamily: fonts.body, color: colors.error, marginBottom: 12 }
});
