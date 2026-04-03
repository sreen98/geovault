import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet } from "react-native";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { PlaceForm } from "../components/PlaceForm";
import { usePlacesStore } from "../stores/places.store";
import { NewPlace, Place } from "../types/place.types";
import { PlacesRepository } from "../db/places.repository";
import { useTheme } from "../contexts/ThemeContext";

export function EditPlaceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [place, setPlace] = useState<Place | null>(null);
  const updatePlace = usePlacesStore((s) => s.updatePlace);
  const { colors } = useTheme();

  useFocusEffect(
    useCallback(() => {
      if (id) {
        setPlace(PlacesRepository.getById(id));
      }
    }, [id])
  );

  const handleSave = (newValues: NewPlace): void => {
    if (!place) return;
    updatePlace(place.id, newValues);
    router.back();
  };

  if (!place) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.surface }]}>
        <Text style={{ color: colors.onSurfaceVariant, fontFamily: "Inter_400Regular" }}>Place not found</Text>
      </View>
    );
  }

  return (
    <PlaceForm
      title="Edit Place"
      initialValues={place}
      onSave={handleSave}
      onCancel={() => router.back()}
      submitLabel="Update Place"
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
