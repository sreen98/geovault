import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  StatusBar,
} from "react-native";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TripsRepository } from "../db/trips.repository";
import { useTripsStore } from "../stores/trips.store";
import { Trip } from "../types/trip.types";
import { Place } from "../types/place.types";
import { PlaceCard } from "../components/PlaceCard";
import { PlacePickerModal } from "../components/PlacePickerModal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { EmptyState } from "../components/EmptyState";
import { ShareService } from "../services/share.service";
import { formatDateRange } from "../utils/date";
import { DEFAULT_TRIP_COLOR, DEFAULT_TRIP_ICON } from "../constants/trips";
import { ROUNDNESS, SPACING } from "../constants/theme";
import { useTheme } from "../contexts/ThemeContext";

type IoniconsName = keyof typeof Ionicons.glyphMap;

function isIoniconName(value: string): value is IoniconsName {
  return value in Ionicons.glyphMap;
}

export function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const deleteTrip = useTripsStore((s) => s.deleteTrip);

  const [trip, setTrip] = useState<Trip | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [showDelete, setShowDelete] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const reload = useCallback((): void => {
    if (!id) return;
    setTrip(TripsRepository.getById(id));
    setPlaces(TripsRepository.getPlacesInTrip(id));
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const handlePlacePress = useCallback((place: Place): void => {
    router.push(`/place/${place.id}`);
  }, []);

  const handleRemovePlace = useCallback(
    (place: Place): void => {
      if (!id) return;
      TripsRepository.removePlace(id, place.id);
      reload();
    },
    [id, reload]
  );

  const handleConfirmPicker = useCallback(
    (selectedIds: string[]): void => {
      if (!id) return;
      TripsRepository.setPlacesForTrip(id, selectedIds);
      setShowPicker(false);
      reload();
    },
    [id, reload]
  );

  const confirmDelete = useCallback((): void => {
    if (!trip) return;
    deleteTrip(trip.id);
    setShowDelete(false);
    router.back();
  }, [trip, deleteTrip]);

  const handleShare = useCallback(async (): Promise<void> => {
    if (!trip) return;
    try {
      await ShareService.shareTrip(trip);
    } catch (_error: unknown) {
      // Share sheet dismissed or unavailable — no action needed.
    }
  }, [trip]);

  const keyExtractor = useCallback((item: Place) => item.id, []);

  const renderItem = useCallback(
    ({ item }: { item: Place }) => (
      <PlaceCard
        place={item}
        onPress={() => handlePlacePress(item)}
        onDelete={() => handleRemovePlace(item)}
      />
    ),
    [handlePlacePress, handleRemovePlace]
  );

  if (!trip) {
    return (
      <View style={[styles.empty, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.onSurfaceVariant, fontFamily: "Inter_400Regular" }}>
          Trip not found
        </Text>
      </View>
    );
  }

  const tripColor = trip.color || DEFAULT_TRIP_COLOR;
  const iconName: IoniconsName =
    trip.icon && isIoniconName(trip.icon) ? trip.icon : DEFAULT_TRIP_ICON;
  const dateRange = formatDateRange(trip.startDate, trip.endDate);

  const ListHeader = (
    <View style={styles.headerBlock}>
      {trip.description ? (
        <View style={[styles.descCard, { backgroundColor: colors.surfaceCard, borderLeftColor: tripColor }]}>
          <Text style={[styles.descText, { color: colors.onSurfaceVariant }]}>
            {trip.description}
          </Text>
        </View>
      ) : null}

      <View style={styles.placesHeaderRow}>
        <Text style={[styles.placesHeading, { color: colors.onSurface }]}>
          Places ({places.length})
        </Text>
        <Pressable
          onPress={() => setShowPicker(true)}
          accessibilityRole="button"
          accessibilityLabel="Add places to trip"
          style={[styles.addPlacesBtn, { backgroundColor: colors.accentMuted, borderColor: colors.accent }]}
        >
          <Ionicons name="add" size={16} color={colors.accent} />
          <Text style={[styles.addPlacesText, { color: colors.accent }]}>Add Places</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <View style={[styles.topBar, { paddingTop: insets.top + SPACING.md }]}>
        <View style={styles.titleRow}>
          <View style={[styles.iconCircle, { backgroundColor: tripColor }]}>
            <Ionicons name={iconName} size={22} color="#FFFFFF" />
          </View>
          <Text style={[styles.name, { color: colors.onSurface }]} numberOfLines={1}>
            {trip.name}
          </Text>
          <Pressable
            onPress={handleShare}
            accessibilityRole="button"
            accessibilityLabel="Share trip"
            hitSlop={12}
          >
            <Ionicons name="share-outline" size={24} color={colors.onSurface} />
          </Pressable>
          <Pressable
            onPress={() => router.push(`/trip/edit/${trip.id}`)}
            accessibilityRole="button"
            accessibilityLabel="Edit trip"
            hitSlop={12}
          >
            <Ionicons name="create-outline" size={26} color={colors.onSurface} />
          </Pressable>
        </View>
        {dateRange ? (
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={14} color={tripColor} />
            <Text style={[styles.dateText, { color: colors.onSurfaceVariant }]}>
              {dateRange}
            </Text>
          </View>
        ) : null}
      </View>

      <FlatList
        data={places}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <EmptyState
            icon="location-outline"
            title="No places in this trip"
            subtitle="Tap Add Places to start building your itinerary."
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        maxToRenderPerBatch={15}
        windowSize={10}
        initialNumToRender={15}
      />

      <View style={[styles.deleteRow, { paddingBottom: insets.bottom + SPACING.md }]}>
        <Pressable
          onPress={() => setShowDelete(true)}
          accessibilityRole="button"
          accessibilityLabel="Delete trip"
          style={[styles.deleteBtn, { borderColor: colors.danger }]}
        >
          <Ionicons name="trash-outline" size={18} color={colors.danger} />
          <Text style={[styles.deleteText, { color: colors.danger }]}>Delete Trip</Text>
        </Pressable>
      </View>

      <PlacePickerModal
        visible={showPicker}
        initialSelectedIds={places.map((p) => p.id)}
        onConfirm={handleConfirmPicker}
        onClose={() => setShowPicker(false)}
      />

      <ConfirmDialog
        visible={showDelete}
        title="Delete Trip"
        message={`Are you sure you want to delete "${trip.name}"? The places in it will not be deleted.`}
        onConfirm={confirmDelete}
        onCancel={() => setShowDelete(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center" },
  topBar: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    marginBottom: 4,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: ROUNDNESS.full,
    justifyContent: "center",
    alignItems: "center",
  },
  name: {
    fontSize: 28,
    fontFamily: "Manrope_700Bold",
    letterSpacing: -0.8,
    flex: 1,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
    marginLeft: 44 + SPACING.md,
  },
  dateText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  headerBlock: {
    paddingTop: SPACING.sm,
  },
  descCard: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderRadius: ROUNDNESS.md,
    borderLeftWidth: 3,
  },
  descText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  placesHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  placesHeading: {
    fontSize: 18,
    fontFamily: "Manrope_700Bold",
  },
  addPlacesBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: ROUNDNESS.full,
    borderWidth: 1,
  },
  addPlacesText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  listContent: {
    paddingBottom: SPACING.md,
  },
  deleteRow: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    paddingVertical: 14,
    borderRadius: ROUNDNESS.md,
    borderWidth: 1,
  },
  deleteText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
});
