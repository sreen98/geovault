import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  StyleSheet,
  Platform,
  StatusBar,
  Switch,
  Linking,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { ExportService } from "../services/export.service";
import { useTheme } from "../contexts/ThemeContext";
import { useSettingsStore } from "../stores/settings.store";
import { usePlacesStore } from "../stores/places.store";
import { SPACING, ROUNDNESS, APP_VERSION } from "../constants/theme";
import { ImportDialog } from "../components/ImportDialog";
import { BackupCard } from "../components/BackupCard";
import { seedDatabase, clearAllPlaces } from "../db/seed-runner";

export function SettingsScreen() {
  const { colors, isDark } = useTheme();
  const { setThemeMode } = useSettingsStore();

  useFocusEffect(
    useCallback(() => {
      // Settings are loaded at app start via _layout.tsx
    }, [])
  );

  const handleExport = async (): Promise<void> => {
    try {
      await ExportService.exportAsJson();
    } catch (_error: unknown) {
      Alert.alert("Export Failed", "Could not export your data. Please try again.");
    }
  };

  const loadPlaces = usePlacesStore((s) => s.loadPlaces);

  const [showImportDialog, setShowImportDialog] = useState(false);

  const handleImport = (): void => {
    setShowImportDialog(true);
  };

  const doImport = async (mode: "overwrite" | "append"): Promise<void> => {
    setShowImportDialog(false);
    try {
      const places = await ExportService.pickAndReadFile();
      if (!places) return;

      if (mode === "overwrite") {
        const count = ExportService.importOverwrite(places);
        loadPlaces();
        Alert.alert("Import Complete", `Replaced all data with ${count} places.`);
      } else {
        const added = ExportService.importAppend(places);
        loadPlaces();
        Alert.alert("Import Complete", `Added ${added} new places. Duplicates were skipped.`);
      }
    } catch (_error: unknown) {
      Alert.alert("Import Failed", "Could not read the file. Make sure it is a valid GeoVault export.");
    }
  };

  const handleSupport = (): void => {
    Linking.openURL("mailto:developersreenz@gmail.com?subject=GeoVault%20Feedback");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={[styles.header, { paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 }]}>
            <Text style={[styles.title, { color: colors.onSurface }]}>Settings</Text>
          </View>

          {/* Privacy Banner */}
          <View style={styles.sectionPadding}>
            <View style={[styles.privacyBanner, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
              <View style={styles.privacyBadgeRow}>
                <Ionicons name="shield-checkmark" size={18} color={colors.accent} />
                <Text style={[styles.privacyBadgeText, { color: colors.accent }]}>PRIVACY FIRST</Text>
              </View>
              <Text style={[styles.privacyTitle, { color: colors.onSurface }]}>Your data, your rules.</Text>
              <Text style={[styles.privacyDescription, { color: colors.onSurfaceVariant }]}>
                GeoVault stores all location data locally on your device. We never see your coordinates, and we never sell your history.
              </Text>
            </View>
          </View>

          {/* Data Management */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.onSurfaceMuted }]}>DATA MANAGEMENT</Text>

            <BackupCard />

            <View style={styles.actionCardsRow}>
              <Pressable
                style={[styles.actionCard, { backgroundColor: colors.surfaceCard }]}
                onPress={handleExport}
                accessibilityRole="button"
                accessibilityLabel="Export JSON"
              >
                <Ionicons name="share-outline" size={28} color={colors.accent} />
                <Text style={[styles.actionCardTitle, { color: colors.onSurface }]}>Export JSON</Text>
                <Text style={[styles.actionCardSubtitle, { color: colors.onSurfaceVariant }]}>Offline archive</Text>
              </Pressable>

              <Pressable
                style={[styles.actionCard, { backgroundColor: colors.surfaceCard }]}
                onPress={handleImport}
                accessibilityRole="button"
                accessibilityLabel="Import JSON"
              >
                <Ionicons name="download-outline" size={28} color={colors.accent} />
                <Text style={[styles.actionCardTitle, { color: colors.onSurface }]}>Import JSON</Text>
                <Text style={[styles.actionCardSubtitle, { color: colors.onSurfaceVariant }]}>Restore data</Text>
              </Pressable>
            </View>
          </View>

          {/* Preferences */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.onSurfaceMuted }]}>PREFERENCES</Text>
            <View style={[styles.card, { backgroundColor: colors.surfaceCard }]}>
              <View style={styles.rowItem}>
                <Ionicons name="moon-outline" size={22} color={colors.onSurfaceVariant} style={styles.prefIcon} />
                <View style={styles.rowTextContainer}>
                  <Text style={[styles.rowTitle, { color: colors.onSurface }]}>Dark Mode</Text>
                  <Text style={[styles.rowSubtitle, { color: colors.onSurfaceVariant }]}>
                    {isDark ? "On" : "Off"}
                  </Text>
                </View>
                <Switch
                  value={isDark}
                  onValueChange={(val) => setThemeMode(val ? "dark" : "light")}
                  trackColor={{ false: colors.surfaceHighlight, true: colors.accent }}
                  thumbColor={colors.white}
                />
              </View>
            </View>
          </View>

          {/* About */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.onSurfaceMuted }]}>ABOUT</Text>
            <View style={[styles.card, { backgroundColor: colors.surfaceCard }]}>
              <View style={styles.rowItem}>
                <Ionicons name="information-circle-outline" size={22} color={colors.onSurfaceVariant} style={styles.prefIcon} />
                <Text style={[styles.rowTitle, { color: colors.onSurface }]}>Version</Text>
                <Text style={[styles.versionText, { color: colors.onSurfaceMuted }]}>{APP_VERSION}</Text>
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: colors.surfaceCard, marginTop: SPACING.sm }]}>
              <Pressable
                style={styles.rowItem}
                onPress={handleSupport}
                accessibilityRole="link"
                accessibilityLabel="Support and Feedback"
              >
                <Ionicons name="help-circle-outline" size={22} color={colors.onSurfaceVariant} style={styles.prefIcon} />
                <Text style={[styles.rowTitle, { color: colors.onSurface, flex: 1 }]}>Support & Feedback</Text>
                <Ionicons name="open-outline" size={18} color={colors.onSurfaceMuted} />
              </Pressable>
            </View>
          </View>

          {/* Dev Tools — only in development */}
          {__DEV__ && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.onSurfaceMuted }]}>DEV TOOLS</Text>
              <View style={styles.actionCardsRow}>
                <Pressable
                  style={[styles.actionCard, { backgroundColor: colors.surfaceCard }]}
                  onPress={() => {
                    const count = seedDatabase();
                    loadPlaces();
                    Alert.alert("Seeded", `Added ${count} places.`);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Seed database"
                >
                  <Ionicons name="leaf-outline" size={28} color={colors.accent} />
                  <Text style={[styles.actionCardTitle, { color: colors.onSurface }]}>Seed Data</Text>
                  <Text style={[styles.actionCardSubtitle, { color: colors.onSurfaceVariant }]}>Add 100 places</Text>
                </Pressable>

                <Pressable
                  style={[styles.actionCard, { backgroundColor: colors.surfaceCard }]}
                  onPress={() => {
                    Alert.alert("Clear All", "Delete all places?", [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Clear",
                        style: "destructive",
                        onPress: () => {
                          clearAllPlaces();
                          loadPlaces();
                          Alert.alert("Cleared", "All places deleted.");
                        },
                      },
                    ]);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Clear all data"
                >
                  <Ionicons name="trash-outline" size={28} color={colors.danger} />
                  <Text style={[styles.actionCardTitle, { color: colors.onSurface }]}>Clear All</Text>
                  <Text style={[styles.actionCardSubtitle, { color: colors.onSurfaceVariant }]}>Delete all places</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.onSurfaceMuted }]}>
              GEOVAULT {new Date().getFullYear()} {"\u2022"} ALL DATA STORED LOCALLY
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
      <ImportDialog
        visible={showImportDialog}
        onAppend={() => doImport("append")}
        onOverwrite={() => doImport("overwrite")}
        onCancel={() => setShowImportDialog(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.sm,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  title: {
    fontSize: 32,
    fontFamily: "Manrope_700Bold",
    letterSpacing: -0.8,
  },
  sectionPadding: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  privacyBanner: {
    borderRadius: ROUNDNESS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
  },
  privacyBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  privacyBadgeText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
  },
  privacyTitle: {
    fontSize: 22,
    fontFamily: "Manrope_700Bold",
    marginBottom: SPACING.xs,
  },
  privacyDescription: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  section: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
    marginBottom: SPACING.sm,
    paddingLeft: SPACING.xs,
  },
  card: {
    borderRadius: ROUNDNESS.lg,
    overflow: "hidden",
  },
  rowItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: ROUNDNESS.full,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.md,
  },
  prefIcon: {
    marginRight: SPACING.md,
  },
  rowTextContainer: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  rowSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  separator: {
    height: 1,
    marginHorizontal: SPACING.md,
  },
  actionCardsRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  actionCard: {
    flex: 1,
    borderRadius: ROUNDNESS.lg,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    alignItems: "center",
    gap: SPACING.xs,
  },
  actionCardTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginTop: SPACING.xs,
  },
  actionCardSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  versionText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginLeft: "auto",
  },
  footer: {
    alignItems: "center",
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  footerText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    letterSpacing: 1,
    opacity: 0.6,
  },
});
