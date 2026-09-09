import { create } from "zustand";
import { Trip, NewTrip } from "../types/trip.types";
import { TripsRepository } from "../db/trips.repository";

const PAGE_SIZE = 30;

interface TripsState {
  trips: Trip[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  totalCount: number;
  loadTrips: () => void;
  loadMore: () => void;
  addTrip: (trip: NewTrip) => Trip;
  updateTrip: (id: string, updates: Partial<NewTrip>) => void;
  deleteTrip: (id: string) => void;
}

export const useTripsStore = create<TripsState>((set, get) => ({
  trips: [],
  isLoading: false,
  isLoadingMore: false,
  hasMore: true,
  totalCount: 0,

  loadTrips: () => {
    const totalCount = TripsRepository.getFilteredCount();
    const trips = TripsRepository.getPaginated(PAGE_SIZE, 0);
    set({
      trips,
      totalCount,
      hasMore: trips.length < totalCount,
      isLoading: false,
    });
  },

  loadMore: () => {
    const { trips, hasMore, isLoadingMore } = get();
    if (!hasMore || isLoadingMore) return;

    set({ isLoadingMore: true });
    const nextPage = TripsRepository.getPaginated(PAGE_SIZE, trips.length);
    set({
      trips: [...trips, ...nextPage],
      hasMore: nextPage.length === PAGE_SIZE,
      isLoadingMore: false,
    });
  },

  addTrip: (trip: NewTrip) => {
    const created = TripsRepository.insert(trip);
    get().loadTrips();
    return created;
  },

  updateTrip: (id: string, updates: Partial<NewTrip>) => {
    TripsRepository.update(id, updates);
    get().loadTrips();
  },

  deleteTrip: (id: string) => {
    TripsRepository.delete(id);
    const { trips } = get();
    set({ trips: trips.filter((t) => t.id !== id) });
  },
}));
