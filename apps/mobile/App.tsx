import { useEffect, useState } from "react";
import { ActivityIndicator, SafeAreaView, ScrollView, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  CormorantGaramond_600SemiBold,
  useFonts as useCormorantFonts
} from "@expo-google-fonts/cormorant-garamond";
import { useFonts, DMSans_400Regular, DMSans_500Medium } from "@expo-google-fonts/dm-sans";
import { AppRole, clearSession, getStoredRole, getToken, setSession } from "./src/api";
import { CustomerApp } from "./src/CustomerApp";
import { LoginScreen } from "./src/LoginScreen";
import { RiderApp } from "./src/RiderApp";
import { colors } from "./src/theme";
import { shared } from "./src/styles";

export default function App() {
  const [dmLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium
  });
  const [displayLoaded] = useCormorantFonts({
    CormorantGaramond_600SemiBold
  });
  const fontsLoaded = dmLoaded && displayLoaded;

  const [booting, setBooting] = useState(true);
  const [role, setRole] = useState<AppRole | null>(null);

  useEffect(() => {
    Promise.all([getToken(), getStoredRole()]).then(([token, storedRole]) => {
      if (token && storedRole) setRole(storedRole);
      setBooting(false);
    });
  }, []);

  async function onLoggedIn(nextRole: AppRole, token: string) {
    await setSession(token, nextRole);
    setRole(nextRole);
  }

  async function onLogout() {
    await clearSession();
    setRole(null);
  }

  if (!fontsLoaded || booting) {
    return (
      <SafeAreaView style={[shared.centered, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.greenAccent} />
      </SafeAreaView>
    );
  }

  if (!role) {
    return (
      <SafeAreaView style={shared.safe}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={shared.scroll}>
          <Text style={shared.brand}>Life Made Easy</Text>
          <LoginScreen onLoggedIn={onLoggedIn} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (role === "customer") {
    return <CustomerApp onLogout={onLogout} />;
  }

  return <RiderApp onLogout={onLogout} />;
}
