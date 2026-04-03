import React from "react";
import { router, useLocalSearchParams } from "expo-router";
import { PlaceForm } from "../components/PlaceForm";
import { usePlacesStore } from "../stores/places.store";
import { NewPlace } from "../types/place.types";

export function AddPlaceScreen() {
  const params = useLocalSearchParams<{
    name?: string;
    latitude?: string;
    longitude?: string;
    sourceUrl?: string;
  }>();

  const addPlace = usePlacesStore((s) => s.addPlace);

  const initialValues: Partial<NewPlace> = {};
  if (params.name) initialValues.name = params.name;
  if (params.latitude) {
    const lat = parseFloat(params.latitude);
    if (!isNaN(lat)) initialValues.latitude = lat;
  }
  if (params.longitude) {
    const lng = parseFloat(params.longitude);
    if (!isNaN(lng)) initialValues.longitude = lng;
  }
  if (params.sourceUrl) initialValues.sourceUrl = params.sourceUrl;

  const handleSave = (place: NewPlace): void => {
    addPlace(place);
    router.back();
  };

  return (
    <PlaceForm
      initialValues={initialValues}
      onSave={handleSave}
      onCancel={() => router.back()}
    />
  );
}
