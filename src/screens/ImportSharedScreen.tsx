import React, { useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, StatusBar } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { decodeImportData, ShareService, SharePayload } from "../services/share.service";
import { StatusDialog } from "../components/StatusDialog";
import { usePlacesStore } from "../stores/places.store";
import { useTripsStore } from "../stores/trips.store";
import { ROUNDNESS, SPACING } from "../constants/theme";
import { useTheme } from "../contexts/ThemeContext";

export function ImportSharedScreen() {
  const { d } = useLocalSearchParams<{ d?: string }>();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const loadPlaces = usePlacesStore((s) => s.loadPlaces);
  const loadTrips = useTripsStore((s) => s.loadTrips);

  const payload: SharePayload | null = useMemo(
    () => (d ? decodeImportData(d) : null),
    [d]
  );

  const [result, setResult] = useState<{ title: string; message: string; type: "success" | "error" } | null>(null);
  const [imported, setImported] = useState(false);

  const handleImport = (): void => {
    if (!payload) return;
    try {
      ShareService.importPayload(payload);
      loadPlaces();
      loadTrips();
      setImported(true);
      const what =
        payload.kind === "trip"
          ? `Trip "${payload.title}" and its ${payload.places.length} ${payload.places.length === 1 ? "place" : "places"} were added.`
          : `"${payload.title}" was added to your places.`;
      setResult({ title: "Imported", message: what, type: "success" });
    } catch (_error: unknown) {
      setResult({
        title: "Import Failed",
        message: "Something went wrong importing this. Please try again.",
        type: "error",
      });
    }
  };

  const goAfterImport = (): void => {
    setResult(null);
    if (!payload) {
      router.replace("/");
      return;
    }
    if (payload.kind === "trip" && payload.trips[0]) {
      router.replace(`/trip/${payload.trips[0].id}`);
    } else if (payload.kind === "place" && payload.places[0]) {
      router.replace(`/place/${payload.places[0].id}`);
    } else {
      router.replace("/");
    }
  };

  const dismissError = (): void => {
    setResult(null);
    if (!imported) router.replace("/");
    else goAfterImport();
  };

  const isTrip = payload?.kind === "trip";
  const iconName: keyof typeof Ionicons.glyphMap = isTrip ? "map-outline" : "location-outline";

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <View style={styles.center}>
        {!payload ? (
          <View style={styles.card}>
            <View style={[styles.iconCircle, { backgroundColor: colors.dangerMuted }]}>
              <Ionicons name="alert-circle-outline" size={32} color={colors.danger} />
            </View>
            <Text style={[styles.title, { color: colors.onSurface }]}>Link not readable</Text>
            <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
              This shared link is invalid or was truncated. Ask the sender to share it again.
            </Text>
            <Pressable
              onPress={() => router.replace("/")}
              accessibilityRole="button"
              accessibilityLabel="Go to home"
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.primaryBtnText}>Go to GeoVault</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.card}>
            <View style={[styles.iconCircle, { backgroundColor: colors.accentMuted }]}>
              <Ionicons name={iconName} size={32} color={colors.accent} />
            </View>
            <Text style={[styles.title, { color: colors.onSurface }]}>
              Import shared {isTrip ? "trip" : "place"}?
            </Text>
            <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
              {isTrip
                ? `Someone shared the trip "${payload.title}" with ${payload.places.length} ${payload.places.length === 1 ? "place" : "places"}. Add it to your GeoVault?`
                : `Someone shared "${payload.title}". Add it to your places?`}
            </Text>

            <Pressable
              onPress={handleImport}
              accessibilityRole="button"
              accessibilityLabel="Import"
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="download-outline" size={18} color={colors.white} style={{ marginRight: 8 }} />
              <Text style={styles.primaryBtnText}>Import</Text>
            </Pressable>
            <Pressable
              onPress={() => router.replace("/")}
              accessibilityRole="button"
              accessibilityLabel="Not now"
              style={styles.secondaryBtn}
            >
              <Text style={[styles.secondaryBtnText, { color: colors.onSurfaceVariant }]}>Not now</Text>
            </Pressable>
          </View>
        )}
      </View>

      {result && (
        <StatusDialog
          visible
          title={result.title}
          message={result.message}
          type={result.type}
          onDismiss={result.type === "success" ? goAfterImport : dismissError}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.xl,
  },
  card: {
    width: "100%",
    alignItems: "center",
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: ROUNDNESS.full,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 24,
    fontFamily: "Manrope_700Bold",
    letterSpacing: -0.5,
    textAlign: "center",
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
    textAlign: "center",
    marginBottom: SPACING.xl,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingVertical: 16,
    borderRadius: ROUNDNESS.lg,
  },
  primaryBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
  secondaryBtn: {
    alignItems: "center",
    paddingVertical: SPACING.md,
    marginTop: SPACING.sm,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
});
