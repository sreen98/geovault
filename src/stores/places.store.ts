import { create } from "zustand";
import { Place, NewPlace } from "../types/place.types";
import { PlacesRepository } from "../db/places.repository";

const PAGE_SIZE = 30;

interface PlacesState {
  places: Place[];
  activeStatusTag: string | null;
  activeCategory: string | null;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  totalCount: number;
  loadPlaces: () => void;
  loadMore: () => void;
  addPlace: (place: NewPlace) => Place;
  updatePlace: (id: string, updates: Partial<NewPlace>) => void;
  deletePlace: (id: string) => void;
  setStatusTag: (tag: string | null) => void;
  setCategory: (category: string | null) => void;
}

export const usePlacesStore = create<PlacesState>((set, get) => ({
  places: [],
  activeStatusTag: null,
  activeCategory: null,
  isLoading: false,
  isLoadingMore: false,
  hasMore: true,
  totalCount: 0,

  loadPlaces: () => {
    const { activeCategory } = get();
    const filters = { category: activeCategory ?? undefined };
    const totalCount = PlacesRepository.getFilteredCount(filters);
    const places = PlacesRepository.getPaginated(PAGE_SIZE, 0, filters);
    set({
      places,
      totalCount,
      hasMore: places.length < totalCount,
      isLoading: false,
    });
  },

  loadMore: () => {
    const { places, activeCategory, hasMore, isLoadingMore } = get();
    if (!hasMore || isLoadingMore) return;

    set({ isLoadingMore: true });
    const filters = { category: activeCategory ?? undefined };
    const nextPage = PlacesRepository.getPaginated(
      PAGE_SIZE,
      places.length,
      filters
    );
    set({
      places: [...places, ...nextPage],
      hasMore: nextPage.length === PAGE_SIZE,
      isLoadingMore: false,
    });
  },

  addPlace: (place: NewPlace) => {
    const created = PlacesRepository.insert(place);
    get().loadPlaces();
    return created;
  },

  updatePlace: (id: string, updates: Partial<NewPlace>) => {
    PlacesRepository.update(id, updates);
    get().loadPlaces();
  },

  deletePlace: (id: string) => {
    PlacesRepository.delete(id);
    const { places } = get();
    set({ places: places.filter((p) => p.id !== id) });
  },

  setStatusTag: (tag: string | null) => {
    set({ activeStatusTag: tag });
    get().loadPlaces();
  },

  setCategory: (category: string | null) => {
    set({ activeCategory: category });
    get().loadPlaces();
  },
}));
