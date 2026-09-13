import { create } from "zustand";
import {
  Collection,
  CollectionSummary,
  NewCollection,
} from "../types/collection.types";
import { Place } from "../types/place.types";
import { CollectionsRepository } from "../db/collections.repository";

const PAGE_SIZE = 30;

interface CollectionsState {
  collections: CollectionSummary[];
  isLoading: boolean;

  /** Detail-screen state for the collection currently open. */
  activeCollection: Collection | null;
  activePlaces: Place[];
  activePlaceCount: number;
  activeHasMore: boolean;
  activeIsLoadingMore: boolean;

  loadCollections: () => void;
  createCollection: (input: NewCollection) => Collection;
  updateCollection: (id: string, updates: Partial<NewCollection>) => void;
  deleteCollection: (id: string) => void;

  openCollection: (id: string) => void;
  loadMoreActivePlaces: () => void;
  addPlacesToActive: (placeIds: string[]) => number;
  removePlaceFromActive: (placeId: string) => void;
  movePlaceInActive: (placeId: string, direction: "up" | "down") => void;
  reorderActivePlaces: (from: number, to: number) => void;
  clearActiveCollection: () => void;
}

export const useCollectionsStore = create<CollectionsState>((set, get) => ({
  collections: [],
  isLoading: false,

  activeCollection: null,
  activePlaces: [],
  activePlaceCount: 0,
  activeHasMore: false,
  activeIsLoadingMore: false,

  loadCollections: () => {
    set({ collections: CollectionsRepository.getAllSummaries(), isLoading: false });
  },

  createCollection: (input: NewCollection) => {
    const created = CollectionsRepository.create(input);
    get().loadCollections();
    return created;
  },

  updateCollection: (id: string, updates: Partial<NewCollection>) => {
    CollectionsRepository.update(id, updates);
    get().loadCollections();

    const { activeCollection } = get();
    if (activeCollection?.id === id) {
      set({ activeCollection: CollectionsRepository.getById(id) });
    }
  },

  /**
   * The active-collection state is deliberately left alone: the detail screen
   * is unmounting, and clearing it here would flash the "not found" view on the
   * way out. openCollection re-reads from the database on the next focus.
   */
  deleteCollection: (id: string) => {
    CollectionsRepository.delete(id);
    set({ collections: get().collections.filter((c) => c.id !== id) });
  },

  /**
   * Loads (or reloads) a collection and its first page of places. Reloading an
   * already-open collection keeps every page the user has scrolled through, so
   * returning from a place screen does not jump them back to the top.
   */
  openCollection: (id: string) => {
    const collection = CollectionsRepository.getById(id);
    if (!collection) {
      set({
        activeCollection: null,
        activePlaces: [],
        activePlaceCount: 0,
        activeHasMore: false,
      });
      return;
    }

    const { activeCollection, activePlaces } = get();
    const keepLoaded =
      activeCollection?.id === id ? activePlaces.length : 0;
    const limit = Math.max(PAGE_SIZE, keepLoaded);

    const placeCount = CollectionsRepository.getPlaceCount(id);
    const places = CollectionsRepository.getPlacesPaginated(id, limit, 0);

    set({
      activeCollection: collection,
      activePlaces: places,
      activePlaceCount: placeCount,
      activeHasMore: places.length < placeCount,
      activeIsLoadingMore: false,
    });
  },

  loadMoreActivePlaces: () => {
    const {
      activeCollection,
      activePlaces,
      activeHasMore,
      activeIsLoadingMore,
    } = get();
    if (!activeCollection || !activeHasMore || activeIsLoadingMore) return;

    set({ activeIsLoadingMore: true });
    const nextPage = CollectionsRepository.getPlacesPaginated(
      activeCollection.id,
      PAGE_SIZE,
      activePlaces.length
    );
    const places = [...activePlaces, ...nextPage];

    set({
      activePlaces: places,
      activeHasMore: places.length < get().activePlaceCount,
      activeIsLoadingMore: false,
    });
  },

  addPlacesToActive: (placeIds: string[]) => {
    const { activeCollection } = get();
    if (!activeCollection) return 0;

    const added = CollectionsRepository.addPlaces(activeCollection.id, placeIds);
    if (added > 0) {
      get().openCollection(activeCollection.id);
      get().loadCollections();
    }
    return added;
  },

  removePlaceFromActive: (placeId: string) => {
    const { activeCollection } = get();
    if (!activeCollection) return;

    CollectionsRepository.removePlace(activeCollection.id, placeId);
    get().openCollection(activeCollection.id);
    get().loadCollections();
  },

  /**
   * Commits a drag. The list has already animated the row into place, so the
   * new order is applied to state first and persisted after — re-reading from
   * the database here would fight the animation with a visible snap-back.
   */
  reorderActivePlaces: (from: number, to: number) => {
    const { activeCollection, activePlaces } = get();
    if (!activeCollection || from === to) return;

    const lastIndex = activePlaces.length - 1;
    if (from < 0 || to < 0 || from > lastIndex || to > lastIndex) return;

    const reordered = [...activePlaces];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);

    set({ activePlaces: reordered });

    // Only the loaded window is passed; setPlaceOrder keeps any places below
    // it in their existing relative order.
    CollectionsRepository.setPlaceOrder(
      activeCollection.id,
      reordered.map((place) => place.id)
    );
    get().loadCollections();
  },

  movePlaceInActive: (placeId: string, direction: "up" | "down") => {
    const { activeCollection } = get();
    if (!activeCollection) return;

    CollectionsRepository.movePlace(activeCollection.id, placeId, direction);
    get().openCollection(activeCollection.id);
  },

  clearActiveCollection: () => {
    set({
      activeCollection: null,
      activePlaces: [],
      activePlaceCount: 0,
      activeHasMore: false,
      activeIsLoadingMore: false,
    });
  },
}));
