import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
  acceptJob,
  fetchMyOrders,
  fetchOpenJobs,
  Order,
  updateJobStatus,
  uploadProofOfDelivery
} from "./api";
import { shared } from "./styles";

type Screen = "jobs" | "active" | "pod";

export function RiderApp(props: { onLogout: () => void }) {
  const [screen, setScreen] = useState<Screen>("jobs");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openJobs, setOpenJobs] = useState<Order[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [podUri, setPodUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

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

    if (toStatus === "delivered") {
      setPodUri(null);
      setScreen("pod");
      return;
    }

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

  async function pickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow photo access to upload proof of delivery.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8
    });
    if (!result.canceled && result.assets[0]) {
      setPodUri(result.assets[0].uri);
    }
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Allow camera access to take proof of delivery photo."
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8
    });
    if (!result.canceled && result.assets[0]) {
      setPodUri(result.assets[0].uri);
    }
  }

  async function submitPod() {
    if (!activeOrder || !podUri) return;
    setUploading(true);
    setError("");
    try {
      await uploadProofOfDelivery(activeOrder.id, podUri);
      await updateJobStatus(activeOrder.id, "delivered");
      setActiveOrder(null);
      setPodUri(null);
      setScreen("jobs");
      await refreshJobs();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit proof of delivery"
      );
    } finally {
      setUploading(false);
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
              <View
                key={job.id}
                style={{
                  marginTop: 12,
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: "#111D13"
                }}
              >
                <Text
                  style={[
                    shared.body,
                    { fontFamily: "DMSans_500Medium", textTransform: "capitalize" }
                  ]}
                >
                  {job.category}
                </Text>
                <Text style={shared.muted}>{job.pickupAddress}</Text>
                <Text style={shared.muted}>→ {job.dropoffAddress}</Text>
                <Text style={[shared.muted, { color: "#C8A96E" }]}>
                  ₦{(job.deliveryFeeKobo / 100).toLocaleString("en-NG")} · You earn ₦
                  {(
                    (job.riderCommissionKobo ?? job.deliveryFeeKobo * 0.25) / 100
                  ).toLocaleString("en-NG")}
                </Text>
                <Pressable
                  style={shared.btn}
                  onPress={() => onAccept(job.id)}
                  disabled={loading}
                >
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
            {(["picked_up", "en_route"] as const).map((status) => (
              <Pressable
                key={status}
                style={shared.btn}
                onPress={() => onStatus(status)}
                disabled={loading}
              >
                <Text style={shared.btnText}>
                  Mark {status.replace("_", " ")}
                </Text>
              </Pressable>
            ))}
            {activeOrder.status === "en_route" ? (
              <Pressable
                style={[shared.btn, { backgroundColor: "#1a6b2e" }]}
                onPress={() => onStatus("delivered")}
                disabled={loading}
              >
                <Text style={shared.btnText}>Mark delivered — upload photo</Text>
              </Pressable>
            ) : null}
            <Pressable style={shared.btnSecondary} onPress={refreshJobs}>
              <Text style={shared.btnText}>Refresh</Text>
            </Pressable>
          </View>
        ) : null}

        {screen === "pod" && activeOrder ? (
          <View style={shared.card}>
            <Text style={shared.title}>Proof of delivery</Text>
            <Text style={shared.muted}>
              Take or upload a photo confirming delivery at{" "}
              {activeOrder.dropoffAddress}.
            </Text>
            {podUri ? (
              <Image
                source={{ uri: podUri }}
                style={{
                  width: "100%",
                  height: 220,
                  borderRadius: 10,
                  marginTop: 12
                }}
                resizeMode="cover"
              />
            ) : null}
            <Pressable
              style={[shared.btn, { marginTop: 16 }]}
              onPress={takePhoto}
              disabled={uploading}
            >
              <Text style={shared.btnText}>Take photo</Text>
            </Pressable>
            <Pressable
              style={shared.btnSecondary}
              onPress={pickPhoto}
              disabled={uploading}
            >
              <Text style={shared.btnText}>Choose from gallery</Text>
            </Pressable>
            {podUri ? (
              <Pressable
                style={[shared.btn, { backgroundColor: "#1a6b2e", marginTop: 8 }]}
                onPress={submitPod}
                disabled={uploading}
              >
                <Text style={shared.btnText}>
                  {uploading ? "Submitting..." : "Submit and complete delivery"}
                </Text>
              </Pressable>
            ) : null}
            <Pressable
              style={shared.btnSecondary}
              onPress={() => setScreen("active")}
              disabled={uploading}
            >
              <Text style={shared.btnText}>Back</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}