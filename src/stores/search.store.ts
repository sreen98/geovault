import { create } from "zustand";
import { Place } from "../types/place.types";
import { PlacesRepository } from "../db/places.repository";

const SEARCH_PAGE_SIZE = 30;

interface SearchState {
  query: string;
  results: Place[];
  hasMore: boolean;
  isLoadingMore: boolean;
  setQuery: (q: string) => void;
  loadMore: () => void;
  clearSearch: () => void;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  query: "",
  results: [],
  hasMore: false,
  isLoadingMore: false,

  setQuery: (q: string) => {
    if (!q.trim()) {
      set({ query: q, results: [], hasMore: false });
      return;
    }
    const results = PlacesRepository.searchPaginated(q, SEARCH_PAGE_SIZE, 0);
    set({
      query: q,
      results,
      hasMore: results.length === SEARCH_PAGE_SIZE,
    });
  },

  loadMore: () => {
    const { query, results, hasMore, isLoadingMore } = get();
    if (!hasMore || isLoadingMore || !query.trim()) return;

    set({ isLoadingMore: true });
    const nextPage = PlacesRepository.searchPaginated(
      query,
      SEARCH_PAGE_SIZE,
      results.length
    );
    set({
      results: [...results, ...nextPage],
      hasMore: nextPage.length === SEARCH_PAGE_SIZE,
      isLoadingMore: false,
    });
  },

  clearSearch: () => {
    set({ query: "", results: [], hasMore: false });
  },
}));
