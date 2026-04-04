import { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useBackupStore } from "../stores/backup.store";
import { usePlacesStore } from "../stores/places.store";
import { BackupRestoreDialog } from "./BackupRestoreDialog";
import { StatusDialog } from "./StatusDialog";
import { ConfirmDialog } from "./ConfirmDialog";
import { AutoBackupSettings } from "./AutoBackupSettings";
import { formatRelativeDate } from "../utils/date";
import { ROUNDNESS, SPACING } from "../constants/theme";
import { useTheme } from "../contexts/ThemeContext";

export function BackupCard() {
  const { colors } = useTheme();
  const {
    isSignedIn,
    userEmail,
    lastBackupTime,
    lastBackupPlaceCount,
    backupState,
    pendingMessage,
    initialize,
    signIn,
    signOut,
    backup,
    restore,
    refreshBackupInfo,
    clearMessage,
  } = useBackupStore();
  const loadPlaces = usePlacesStore((s) => s.loadPlaces);
  const [showRestore, setShowRestore] = useState(false);
  const [showSignOut, setShowSignOut] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isSignedIn) {
      refreshBackupInfo();
    }
  }, [isSignedIn, refreshBackupInfo]);

  const isBusy = backupState !== "idle" && backupState !== "error";

  const handleRestore = (mode: "overwrite" | "append"): void => {
    setShowRestore(false);
    restore(mode).then(() => loadPlaces());
  };

  const statusDialog = pendingMessage ? (
    <StatusDialog
      visible
      title={pendingMessage.title}
      message={pendingMessage.message}
      type={pendingMessage.type}
      onDismiss={clearMessage}
    />
  ) : null;

  if (!isSignedIn) {
    return (
      <>
        <Pressable
          style={[styles.signInCard, { backgroundColor: colors.surfaceCard }]}
          onPress={signIn}
          disabled={isBusy}
          accessibilityRole="button"
          accessibilityLabel="Sign in with Google for backup"
        >
          <View style={styles.signInRow}>
            <View style={[styles.iconCircle, { backgroundColor: colors.surfaceHighlight }]}>
              <Ionicons name="cloud-upload-outline" size={22} color={colors.accent} />
            </View>
            <View style={styles.signInText}>
              <Text style={[styles.signInTitle, { color: colors.onSurface }]}>
                Backup to Google Drive
              </Text>
              <Text style={[styles.signInSub, { color: colors.onSurfaceVariant }]}>
                Sign in to enable cloud backup
              </Text>
            </View>
            {isBusy ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Ionicons name="chevron-forward" size={20} color={colors.onSurfaceMuted} />
            )}
          </View>
        </Pressable>
        {statusDialog}
      </>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.surfaceCard }]}>
      {/* Header: user info */}
      <View style={styles.headerRow}>
        <View style={[styles.iconCircle, { backgroundColor: colors.surfaceHighlight }]}>
          <Ionicons name="cloud-done-outline" size={22} color={colors.accent} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.onSurface }]}>Google Drive Backup</Text>
          <Text style={[styles.email, { color: colors.onSurfaceMuted }]}>{userEmail}</Text>
        </View>
      </View>

      {/* Last backup info */}
      {lastBackupTime && (
        <View style={[styles.infoRow, { borderTopColor: colors.surfaceContainerHigh }]}>
          <Ionicons name="time-outline" size={14} color={colors.onSurfaceMuted} />
          <Text style={[styles.infoText, { color: colors.onSurfaceVariant }]}>
            Last backup: {formatRelativeDate(lastBackupTime).toLowerCase()}
            {lastBackupPlaceCount !== null ? ` - ${lastBackupPlaceCount} places` : ""}
          </Text>
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.actions}>
        <Pressable
          onPress={backup}
          disabled={isBusy}
          accessibilityRole="button"
          accessibilityLabel="Backup now"
          style={[styles.actionBtn, { backgroundColor: colors.accent }]}
        >
          {backupState === "backing-up" ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={18} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>Backup Now</Text>
            </>
          )}
        </Pressable>

        <Pressable
          onPress={() => setShowRestore(true)}
          disabled={isBusy}
          accessibilityRole="button"
          accessibilityLabel="Restore from backup"
          style={[styles.actionBtn, { backgroundColor: colors.surfaceContainerHigh }]}
        >
          {backupState === "restoring" ? (
            <ActivityIndicator size="small" color={colors.onSurface} />
          ) : (
            <>
              <Ionicons name="cloud-download-outline" size={18} color={colors.onSurface} />
              <Text style={[styles.actionBtnTextAlt, { color: colors.onSurface }]}>Restore</Text>
            </>
          )}
        </Pressable>
      </View>

      {/* Auto backup settings */}
      <AutoBackupSettings />

      {/* Sign out */}
      <View style={styles.signOutRow}>
        <Pressable
          onPress={() => setShowSignOut(true)}
          disabled={isBusy}
          accessibilityRole="button"
          accessibilityLabel="Sign out of Google"
          style={[styles.signOutBtn, { borderColor: colors.danger }]}
        >
          <Ionicons name="log-out-outline" size={16} color={colors.danger} />
          <Text style={[styles.signOutText, { color: colors.danger }]}>Sign Out</Text>
        </Pressable>
      </View>

      <ConfirmDialog
        visible={showSignOut}
        title="Sign Out"
        message="You will need to sign in again to backup or restore your data."
        confirmLabel="Sign Out"
        confirmIcon="log-out-outline"
        onConfirm={() => {
          setShowSignOut(false);
          signOut();
        }}
        onCancel={() => setShowSignOut(false)}
      />

      <BackupRestoreDialog
        visible={showRestore}
        lastBackupTime={lastBackupTime}
        lastBackupPlaceCount={lastBackupPlaceCount}
        onAppend={() => handleRestore("append")}
        onOverwrite={() => handleRestore("overwrite")}
        onCancel={() => setShowRestore(false)}
      />
      {statusDialog}
    </View>
  );
}

const styles = StyleSheet.create({
  signInCard: {
    borderRadius: ROUNDNESS.lg,
    overflow: "hidden",
  },
  signInRow: {
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
  signInText: { flex: 1 },
  signInTitle: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  signInSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  card: {
    borderRadius: ROUNDNESS.lg,
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
  },
  headerText: { flex: 1 },
  title: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  email: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
  },
  infoText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  actions: {
    flexDirection: "row",
    gap: SPACING.sm,
    padding: SPACING.md,
    paddingTop: SPACING.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    paddingVertical: 12,
    borderRadius: ROUNDNESS.md,
  },
  actionBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
  actionBtnTextAlt: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  signOutRow: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    paddingVertical: 12,
    borderRadius: ROUNDNESS.md,
    borderWidth: 1,
  },
  signOutText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
});
