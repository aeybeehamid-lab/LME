import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { registerPushToken } from "./api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true
  })
});

export async function setupPushNotifications(): Promise<void> {
  if (!Device.isDevice) {
    return;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    return;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("orders", {
      name: "Order updates",
      importance: Notifications.AndroidImportance.HIGH
    });
  }

  try {
    const deviceToken = await Notifications.getDevicePushTokenAsync();
    const token =
      typeof deviceToken.data === "string"
        ? deviceToken.data
        : String(deviceToken.data);

    await registerPushToken(
      token,
      Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web"
    );
  } catch (err) {
    console.warn("Push token registration failed:", err);
  }
}
