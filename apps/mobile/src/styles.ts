import { StyleSheet } from "react-native";
import { colors, fonts } from "./theme";

export const shared = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  brand: {
    fontFamily: fonts.displayItalic,
    fontStyle: "italic",
    fontSize: 32,
    color: colors.text,
    marginBottom: 16
  },
  title: {
    fontFamily: fonts.sectionTitle,
    fontSize: 20,
    color: colors.text,
    marginBottom: 8
  },
  body: { fontFamily: fonts.body, color: colors.text, marginBottom: 4 },
  muted: { fontFamily: fonts.body, color: colors.muted, marginBottom: 6, fontSize: 14 },
  label: { fontFamily: fonts.bodyMedium, color: colors.muted, marginTop: 8, fontSize: 13 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.green,
    padding: 16,
    marginBottom: 16
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.green,
    borderRadius: 10,
    color: colors.text,
    padding: 12,
    marginBottom: 12,
    fontFamily: fonts.body,
    fontSize: 15
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
  btnText: { fontFamily: fonts.bodyMedium, color: colors.text, fontSize: 14 },
  link: { fontFamily: fonts.body, color: colors.greenAccent },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  error: { fontFamily: fonts.body, color: colors.error, marginBottom: 12 },
  roleRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  roleChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.green,
    alignItems: "center"
  },
  roleChipActive: { backgroundColor: colors.green },
  roleChipText: { fontFamily: fonts.bodyMedium, color: colors.text, fontSize: 13 }
});
