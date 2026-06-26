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
      Alert.alert("Permission needed", "Allow camera access to take proof of delivery photo.");
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
      setError(err instanceof Error ? err.message : "Failed to submit proof of delivery");
    } finally {
      setUploading(false);
    }
  }

  return (
    <SafeAreaView style={shared.safe}>
      <ScrollView contentContainerStyle={shared.scroll}>
        <Text style={shared.brand}>LME Rider</Text>
        {error ? <Text style={shared.error}>{error}</Text> : null}

        {/* Job board */}
        {screen === "jobs" ? (
          <View