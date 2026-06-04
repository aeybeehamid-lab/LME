import admin from "firebase-admin";
import {
  ensureFirebaseAdmin,
  isFirebaseConfigured
} from "../auth/firebase.service";

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export async function sendPushToTokens(
  tokens: string[],
  payload: PushPayload
): Promise<{ sent: number; failed: number; devLog?: boolean }> {
  if (!tokens.length) {
    return { sent: 0, failed: 0 };
  }

  if (!isFirebaseConfigured()) {
    console.log(`[FCM dev] ${payload.title} — ${payload.body}`, payload.data ?? "");
    return { sent: 0, failed: 0, devLog: true };
  }

  ensureFirebaseAdmin();
  const messaging = admin.messaging();
  const response = await messaging.sendEachForMulticast({
    tokens,
    notification: {
      title: payload.title,
      body: payload.body
    },
    data: payload.data ?? {},
    android: { priority: "high" },
    apns: { payload: { aps: { sound: "default" } } }
  });

  return {
    sent: response.successCount,
    failed: response.failureCount
  };
}
