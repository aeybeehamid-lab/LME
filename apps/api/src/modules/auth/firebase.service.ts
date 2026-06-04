import admin from "firebase-admin";
import { config } from "../../config";
import { AppError } from "../../middleware/errorHandler";

let initialized = false;

function ensureFirebaseAdmin(): admin.app.App {
  if (!config.firebaseProjectId) {
    throw new AppError(
      503,
      "Firebase is not configured on the server.",
      "FIREBASE_UNAVAILABLE"
    );
  }

  if (!initialized) {
    if (config.firebaseClientEmail && config.firebasePrivateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: config.firebaseProjectId,
          clientEmail: config.firebaseClientEmail,
          privateKey: config.firebasePrivateKey.replace(/\\n/g, "\n")
        })
      });
    } else {
      admin.initializeApp({ projectId: config.firebaseProjectId });
    }
    initialized = true;
  }

  return admin.app();
}

export async function verifyFirebaseIdToken(idToken: string) {
  const app = ensureFirebaseAdmin();
  try {
    const decoded = await app.auth().verifyIdToken(idToken);
    const phone = decoded.phone_number;
    if (!phone) {
      throw new AppError(
        400,
        "Firebase account must include a verified phone number.",
        "PHONE_REQUIRED"
      );
    }
    return {
      firebaseUid: decoded.uid,
      phone
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(401, "Invalid or expired Firebase session.", "INVALID_TOKEN");
  }
}

export function isFirebaseConfigured(): boolean {
  return Boolean(config.firebaseProjectId);
}
