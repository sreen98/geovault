import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  StatusBar,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTripsStore } from "../stores/trips.store";
import { TripCard } from "../components/TripCard";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useTheme } from "../contexts/ThemeContext";
import { Trip } from "../types/trip.types";
import { SPACING } from "../constants/theme";

export function TripsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { trips, hasMore, isLoadingMore, loadTrips, loadMore, deleteTrip } =
    useTripsStore();

  useFocusEffect(
    useCallback(() => {
      loadTrips();
    }, [loadTrips])
  );

  const keyExtractor = useCallback((item: Trip) => item.id, []);

  const handlePress = useCallback((trip: Trip): void => {
    router.push(`/trip/${trip.id}`);
  }, []);

  const [deleteTarget, setDeleteTarget] = useState<Trip | null>(null);

  const handleDelete = useCallback((trip: Trip): void => {
    setDeleteTarget(trip);
  }, []);

  const confirmDelete = useCallback((): void => {
    if (deleteTarget) {
      deleteTrip(deleteTarget.id);
      setDeleteTarget(null);
    }
  }, [deleteTarget, deleteTrip]);

  const renderItem = useCallback(
    ({ item }: { item: Trip }) => (
      <TripCard
        trip={item}
        onPress={() => handlePress(item)}
        onDelete={() => handleDelete(item)}
      />
    ),
    [handlePress, handleDelete]
  );

  const hasTrips = trips.length > 0;

  const ListHeader = useCallback(
    () => (
      <View style={styles.headerContent}>
        <Text style={[styles.appTitle, { color: colors.onSurface }]}>Trips</Text>
        <Text style={[styles.appSubtitle, { color: colors.onSurfaceVariant }]}>
          Group your places by trip or theme.
        </Text>
      </View>
    ),
    [colors]
  );

  if (!hasTrips) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <View style={styles.emptyScreen}>
          <Text style={[styles.appTitle, { color: colors.onSurface }]}>Trips</Text>
          <View style={styles.heroSection}>
            <Text style={[styles.heroTitle, { color: colors.onSurface }]}>Grouped</Text>
            <Text style={[styles.heroTitleAccent, { color: colors.accent }]}>Places.</Text>
            <Text style={[styles.heroSubtitle, { color: colors.onSurfaceVariant }]}>
              Bundle places into trips{"\n"}so they travel together.
            </Text>
          </View>
          <View style={styles.emptyCenter}>
            <Ionicons name="map-outline" size={48} color={colors.onSurfaceMuted} />
            <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>No trips yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.onSurfaceMuted }]}>
              Tap the + button to create your first trip.
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => router.push("/trip/new")}
          accessibilityRole="button"
          accessibilityLabel="Add new trip"
          className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-accent items-center justify-center z-10"
        >
          <Ionicons name="add" size={28} color={colors.background} />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <FlatList
        data={trips}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeader}
        renderItem={renderItem}
        style={styles.flatList}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={
          isLoadingMore ? (
            <ActivityIndicator size="small" color={colors.accent} style={styles.loadingMore} />
          ) : null
        }
        onEndReached={hasMore ? loadMore : undefined}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        maxToRenderPerBatch={15}
        windowSize={10}
        initialNumToRender={15}
      />
      <Pressable
        onPress={() => router.push("/trip/new")}
        accessibilityRole="button"
        accessibilityLabel="Add new trip"
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-accent items-center justify-center z-10"
      >
        <Ionicons name="add" size={28} color={colors.background} />
      </Pressable>
      <ConfirmDialog
        visible={deleteTarget !== null}
        title="Delete Trip"
        message={`Are you sure you want to delete "${deleteTarget?.name ?? ""}"? The places in it will not be deleted.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  flatList: {
    flex: 1,
    zIndex: 1,
  },
  headerContent: {
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  appTitle: {
    fontSize: 32,
    fontFamily: "Manrope_700Bold",
    letterSpacing: -0.8,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xs,
  },
  appSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  emptyScreen: {
    flex: 1,
    paddingTop: SPACING.lg,
  },
  emptyCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.xxl * 2,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Manrope_700Bold",
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingHorizontal: SPACING.xl,
  },
  heroSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  heroTitle: {
    fontSize: 44,
    fontFamily: "Manrope_700Bold",
    letterSpacing: -1.5,
    lineHeight: 50,
  },
  heroTitleAccent: {
    fontSize: 44,
    fontFamily: "Manrope_700Bold",
    letterSpacing: -1.5,
    lineHeight: 50,
    fontStyle: "italic",
  },
  heroSubtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
    marginTop: SPACING.sm,
  },
  listContent: {
    paddingTop: SPACING.sm,
    paddingBottom: 120,
  },
  loadingMore: {
    paddingVertical: SPACING.lg,
  },
});
