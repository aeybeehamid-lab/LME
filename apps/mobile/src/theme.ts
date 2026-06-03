import { Platform } from "react-native";

/** Brand tokens — align with apps/dashboard/src/app/globals.css */
export const colors = {
  bg: "#080E09",
  card: "#0D1610",
  surface: "#111D13",
  green: "#1A6B2E",
  greenAccent: "#5AAD64",
  text: "#E8EFE9",
  muted: "#6B8A6E",
  gold: "#C8A96E",
  error: "#ff8f8f"
};

/** Times New Roman for italic brand/page titles; DM Sans for UI */
export const fonts = {
  body: "DMSans_400Regular",
  bodyMedium: "DMSans_500Medium",
  displayItalic: Platform.select({
    ios: "Times New Roman",
    android: "serif",
    default: "Times New Roman"
  }) as string,
  sectionTitle: "DMSans_500Medium"
};
