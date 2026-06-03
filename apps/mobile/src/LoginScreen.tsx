import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { AppRole, devLogin } from "./api";
import { shared } from "./styles";

export function LoginScreen(props: {
  onLoggedIn: (role: AppRole, token: string) => void;
}) {
  const [phone, setPhone] = useState("+234");
  const [role, setRole] = useState<AppRole>("customer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit() {
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

  return (
    <View style={shared.card}>
      <Text style={shared.title}>Sign in</Text>
      <Text style={shared.muted}>Dev login — choose Customer or Rider.</Text>
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
      <Text style={shared.label}>Phone</Text>
      <TextInput
        style={shared.input}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      {error ? <Text style={shared.error}>{error}</Text> : null}
      <Pressable style={shared.btn} onPress={onSubmit} disabled={loading}>
        <Text style={shared.btnText}>{loading ? "..." : "Sign in"}</Text>
      </Pressable>
    </View>
  );
}
