import { useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import { ConfirmationResult, getAuth, signInWithPhoneNumber } from "firebase/auth";
import { AppRole, devLogin, firebaseLogin } from "./api";
import { firebaseConfig, getFirebaseApp, isFirebaseConfigured } from "./firebase";
import { shared } from "./styles";

const firebaseEnabled = isFirebaseConfigured();

export function LoginScreen(props: {
  onLoggedIn: (role: AppRole, token: string) => void;
}) {
  const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModal>(null);
  const confirmationRef = useRef<ConfirmationResult | null>(null);

  const [phone, setPhone] = useState("+234");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [useDevLogin, setUseDevLogin] = useState(!firebaseEnabled);
  const [role, setRole] = useState<AppRole>("customer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function getMobileAuth() {
    return getAuth(getFirebaseApp());
  }

  async function onDevSubmit() {
    setLoading(true);
    setError("");
    try {
      const { token } = await devLogin(phone, role);
      props.onLoggedIn(role, token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function onSendOtp() {
    setLoading(true);
    setError("");
    try {
      const auth = getMobileAuth();
      confirmationRef.current = await signInWithPhoneNumber(
        auth,
        phone,
        recaptchaVerifier.current!
      );
      setOtpSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code");
    } finally {
      setLoading(false);
    }
  }

  async function onVerifyOtp() {
    setLoading(true);
    setError("");
    try {
      if (!confirmationRef.current) {
        throw new Error("Send a verification code first.");
      }
      const credential = await confirmationRef.current.confirm(otp);
      const idToken = await credential.user.getIdToken();
      const { token } = await firebaseLogin(idToken, role);
      props.onLoggedIn(role, token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={shared.card}>
      {firebaseEnabled && !useDevLogin ? (
        <FirebaseRecaptchaVerifierModal
          ref={recaptchaVerifier}
          firebaseConfig={firebaseConfig}
          attemptInvisibleVerification
        />
      ) : null}

      <Text style={shared.title}>Sign in</Text>
      <Text style={shared.muted}>
        {useDevLogin
          ? "Dev login — choose Customer or Rider."
          : "SMS verification via Firebase."}
      </Text>

      <View style={shared.roleRow}>
        {(["customer", "rider"] as const).map((r) => (
          <Pressable
            key={r}
            style={[shared.roleChip, role === r && shared.roleChipActive]}
            onPress={() => setRole(r)}
          >
            <Text style={shared.roleChipText}>{r}</Text>
          </Pressable>
        ))}
      </View>

      {firebaseEnabled ? (
        <Pressable onPress={() => setUseDevLogin((v) => !v)} style={{ marginBottom: 8 }}>
          <Text style={shared.link}>
            {useDevLogin ? "Use Firebase SMS code instead" : "Use dev login instead"}
          </Text>
        </Pressable>
      ) : null}

      <Text style={shared.label}>Phone</Text>
      <TextInput
        style={shared.input}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        editable={!otpSent || useDevLogin}
      />

      {!useDevLogin && otpSent ? (
        <>
          <Text style={shared.label}>Verification code</Text>
          <TextInput
            style={shared.input}
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            placeholder="6-digit SMS code"
          />
        </>
      ) : null}

      {error ? <Text style={shared.error}>{error}</Text> : null}

      <Pressable
        style={shared.btn}
        onPress={() => {
          if (useDevLogin) void onDevSubmit();
          else if (otpSent) void onVerifyOtp();
          else void onSendOtp();
        }}
        disabled={loading}
      >
        <Text style={shared.btnText}>
          {loading
            ? "..."
            : useDevLogin
              ? "Sign in"
              : otpSent
                ? "Verify & sign in"
                : "Send verification code"}
        </Text>
      </Pressable>
    </View>
  );
}
