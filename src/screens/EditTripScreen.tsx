import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { TripForm } from "../components/TripForm";
import { useTripsStore } from "../stores/trips.store";
import { NewTrip, Trip } from "../types/trip.types";
import { TripsRepository } from "../db/trips.repository";
import { useTheme } from "../contexts/ThemeContext";

export function EditTripScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const updateTrip = useTripsStore((s) => s.updateTrip);
  const { colors } = useTheme();

  useFocusEffect(
    useCallback(() => {
      if (id) {
        setTrip(TripsRepository.getById(id));
      }
    }, [id])
  );

  const handleSave = (newValues: NewTrip): void => {
    if (!trip) return;
    updateTrip(trip.id, newValues);
    router.back();
  };

  if (!trip) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.surface }]}>
        <Text style={{ color: colors.onSurfaceVariant, fontFamily: "Inter_400Regular" }}>
          Trip not found
        </Text>
      </View>
    );
  }

  return (
    <TripForm
      title="Edit Trip"
      initialValues={trip}
      onSave={handleSave}
      onCancel={() => router.back()}
      submitLabel="Update Trip"
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
