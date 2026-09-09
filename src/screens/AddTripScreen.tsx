import React from "react";
import { router } from "expo-router";
import { TripForm } from "../components/TripForm";
import { useTripsStore } from "../stores/trips.store";
import { NewTrip } from "../types/trip.types";

export function AddTripScreen() {
  const addTrip = useTripsStore((s) => s.addTrip);

  const handleSave = (trip: NewTrip): void => {
    addTrip(trip);
    router.back();
  };

  return <TripForm onSave={handleSave} onCancel={() => router.back()} />;
}
