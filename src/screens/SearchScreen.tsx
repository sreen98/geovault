import React, { useRef, useCallback, useEffect, useState } from "react";
import {
  View,
  TextInput,
  FlatList,
  StyleSheet,
  Text,
  StatusBar,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSearchStore } from "../stores/search.store";
import { usePlacesStore } from "../stores/places.store";
import { PlacesRepository } from "../db/places.repository";
import { PlaceCard } from "../components/PlaceCard";
import { EmptyState } from "../components/EmptyState";
import { Place, PlaceCategory } from "../types/place.types";
import { CATEGORIES, CATEGORY_ICONS } from "../constants/categories";
import { pluralize } from "../utils/plural";
import { CATEGORY_COLORS, SPACING, ROUNDNESS } from "../constants/theme";
import { useTheme } from "../contexts/ThemeContext";

interface CategoryCount {
  category: PlaceCategory;
  count: number;
}

function loadCategoryCounts(): CategoryCount[] {
  const counts: CategoryCount[] = [];
  for (const row of PlacesRepository.getCategoryCounts()) {
    const category = CATEGORIES.find((c) => c === row.category);
    if (category) counts.push({ category, count: row.count });
  }
  return counts;
}

/** Splits a list into rows of two so the grid stays aligned with an odd count. */
function toPairs<T>(items: T[]): [T, T | null][] {
  const rows: [T, T | null][] = [];
  for (let i = 0; i < items.length; i += 2) {
    rows.push([items[i], items[i + 1] ?? null]);
  }
  return rows;
}

export function SearchScreen() {
  const {
    query,
    results,
    collectionResults,
    hasMore,
    isLoadingMore,
    recentSearches,
    setQuery,
    loadMore,
    loadRecentSearches,
    addRecentSearch,
    clearRecentSearches,
  } = useSearchStore();
  const setCategory = usePlacesStore((s) => s.setCategory);
  const { colors, isDark } = useTheme();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [text, setText] = useState<string>(query);
  const [categoryCounts, setCategoryCounts] = useState<CategoryCount[]>([]);

  useEffect(() => {
    loadRecentSearches();
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [loadRecentSearches]);

  useFocusEffect(
    useCallback(() => {
      setCategoryCounts(loadCategoryCounts());
    }, [])
  );

  const handleQueryChange = useCallback(
    (value: string): void => {
      setText(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setQuery(value);
      }, 300);
    },
    [setQuery]
  );

  /** Fills the field and searches immediately, skipping the debounce. */
  const runSearch = useCallback(
    (term: string): void => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setText(term);
      setQuery(term);
      addRecentSearch(term);
    },
    [setQuery, addRecentSearch]
  );

  const handleClear = useCallback((): void => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setText("");
    setQuery("");
  }, [setQuery]);

  const handleCategoryPress = useCallback(
    (category: PlaceCategory): void => {
      setCategory(category);
      router.navigate("/");
    },
    [setCategory]
  );

  const openPlace = useCallback(
    (place: Place): void => {
      addRecentSearch(query);
      router.push(`/place/${place.id}`);
    },
    [addRecentSearch, query]
  );

  const keyExtractor = useCallback((item: Place) => item.id, []);

  const renderItem = useCallback(
    ({ item }: { item: Place }) => (
      <PlaceCard place={item} onPress={() => openPlace(item)} />
    ),
    [openPlace]
  );

  const hasQuery = query.trim() !== "";
  const hasCollectionResults = collectionResults.length > 0;

  // Collections ride along as a header section so the whole result set scrolls
  // as one list rather than two competing scroll areas.
  const ListHeader = useCallback(() => {
    if (!hasCollectionResults) return null;

    return (
      <View style={styles.collectionSection}>
        <Text style={[styles.sectionLabel, { color: colors.onSurfaceMuted }]}>
          COLLECTIONS
        </Text>
        {collectionResults.map((collection) => (
          <Pressable
            key={collection.id}
            onPress={() => {
              addRecentSearch(query);
              router.push(`/collection/${collection.id}`);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Open collection ${collection.name}`}
            style={[styles.collectionRow, { backgroundColor: colors.surfaceCard }]}
          >
            <View style={[styles.collectionIcon, { backgroundColor: `${collection.color}26` }]}>
              <Ionicons name={collection.icon} size={18} color={collection.color} />
            </View>
            <View style={styles.collectionText}>
              <Text
                style={[styles.collectionName, { color: colors.onSurface }]}
                numberOfLines={1}
              >
                {collection.name}
              </Text>
              <Text
                style={[styles.collectionCount, { color: colors.onSurfaceMuted }]}
              >
                {pluralize(collection.placeCount, "place")}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.onSurfaceMuted}
            />
          </Pressable>
        ))}
        {results.length > 0 ? (
          <Text style={[styles.sectionLabel, styles.placesLabel, { color: colors.onSurfaceMuted }]}>
            PLACES
          </Text>
        ) : null}
      </View>
    );
  }, [addRecentSearch, collectionResults, colors, hasCollectionResults, query, results.length]);

  // Shown instead of a blank screen before the user types anything.
  const discovery =
    recentSearches.length === 0 && categoryCounts.length === 0 ? (
      <EmptyState
        icon="search-outline"
        title="Explore your vault"
        subtitle="Search names, notes and tags once you have saved a few places."
      />
    ) : (
      <View style={styles.discovery}>
        {recentSearches.length > 0 ? (
          <View style={styles.discoverySection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionLabel, { color: colors.onSurfaceMuted }]}>
                RECENT
              </Text>
              <Pressable
                onPress={clearRecentSearches}
                accessibilityRole="button"
                accessibilityLabel="Clear recent searches"
                hitSlop={12}
              >
                <Text style={[styles.sectionAction, { color: colors.accent }]}>Clear</Text>
              </Pressable>
            </View>
            {recentSearches.map((term) => (
              <Pressable
                key={term}
                onPress={() => runSearch(term)}
                accessibilityRole="button"
                accessibilityLabel={`Search for ${term}`}
                style={({ pressed }) => [styles.recentRow, pressed && styles.pressed]}
              >
                <Ionicons name="time-outline" size={18} color={colors.onSurfaceMuted} />
                <Text
                  style={[styles.recentText, { color: colors.onSurface }]}
                  numberOfLines={1}
                >
                  {term}
                </Text>
                <Ionicons name="arrow-up-outline" size={16} color={colors.onSurfaceMuted} style={styles.recentArrow} />
              </Pressable>
            ))}
          </View>
        ) : null}

        {categoryCounts.length > 0 ? (
          <View style={styles.discoverySection}>
            <Text style={[styles.sectionLabel, { color: colors.onSurfaceMuted }]}>
              BROWSE BY CATEGORY
            </Text>
            {toPairs(categoryCounts).map((row) => (
              <View key={row[0].category} style={styles.tileRow}>
                {row.map((item, index) => {
                  if (!item) return <View key={`spacer-${index}`} style={styles.tileSpacer} />;
                  const color = CATEGORY_COLORS[item.category];
                  return (
                    <Pressable
                      key={item.category}
                      onPress={() => handleCategoryPress(item.category)}
                      accessibilityRole="button"
                      accessibilityLabel={`Show ${pluralize(item.count, "place")} in ${item.category}`}
                      style={({ pressed }) => [
                        styles.tile,
                        { backgroundColor: `${color}1F`, borderColor: `${color}33` },
                        pressed && styles.pressed,
                      ]}
                    >
                      <Ionicons name={CATEGORY_ICONS[item.category]} size={24} color={color} />
                      <View>
                        <Text
                          style={[styles.tileCount, { color: colors.onSurface }]}
                        >
                          {item.count}
                        </Text>
                        <Text
                          style={[styles.tileLabel, { color: colors.onSurfaceVariant }]}
                          numberOfLines={1}
                        >
                          {item.category}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        ) : null}
      </View>
    );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.onSurface }]}>
            Search
          </Text>
          <View
            style={[
              styles.searchContainer,
              { backgroundColor: colors.surfaceCard, borderColor: colors.border },
            ]}
          >
            <Ionicons
              name="search"
              size={20}
              color={colors.onSurfaceMuted}
              style={styles.searchIcon}
            />
            <TextInput
              style={[styles.searchInput, { color: colors.onSurface }]}
              placeholder="Names, notes, or tags..."
              placeholderTextColor={colors.onSurfaceMuted}
              value={text}
              onChangeText={handleQueryChange}
              onSubmitEditing={() => runSearch(text)}
              autoCapitalize="none"
              returnKeyType="search"
              accessibilityLabel="Search places"
            />
            {text ? (
              <Pressable
                onPress={handleClear}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
                hitSlop={12}
              >
                <Ionicons name="close-circle" size={20} color={colors.onSurfaceMuted} />
              </Pressable>
            ) : null}
          </View>
        </View>

        <FlatList
          data={results}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={[
            styles.listContent,
            hasQuery && results.length === 0 && !hasCollectionResults && styles.emptyList,
          ]}
          ListEmptyComponent={
            !hasQuery ? (
              discovery
            ) : hasCollectionResults ? (
              <Text
                style={[styles.noPlaces, { color: colors.onSurfaceMuted }]}
              >
                No matching places.
              </Text>
            ) : (
              <EmptyState
                icon="search-outline"
                title="No results found"
                subtitle="Try different keywords or check your spelling."
              />
            )
          }
          ListFooterComponent={
            isLoadingMore ? (
              <ActivityIndicator
                size="small"
                color={colors.accent}
                style={styles.loadingMore}
              />
            ) : null
          }
          onEndReached={hasMore ? loadMore : undefined}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          maxToRenderPerBatch={15}
          windowSize={10}
          initialNumToRender={15}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 32,
    fontFamily: "Manrope_700Bold",
    marginBottom: SPACING.md,
    letterSpacing: -0.8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: ROUNDNESS.lg,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    height: 52,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyList: {
    flex: 1,
    justifyContent: "center",
  },
  loadingMore: {
    paddingVertical: SPACING.lg,
  },
  pressed: {
    opacity: 0.7,
  },
  discovery: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    gap: SPACING.xl,
  },
  discoverySection: {
    gap: SPACING.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
  },
  sectionAction: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    minHeight: 44,
  },
  recentText: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  recentArrow: {
    transform: [{ rotate: "-45deg" }],
  },
  tileRow: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  tile: {
    flex: 1,
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: ROUNDNESS.lg,
    borderWidth: 1,
  },
  tileSpacer: {
    flex: 1,
  },
  tileCount: {
    fontSize: 24,
    fontFamily: "Manrope_700Bold",
    fontVariant: ["tabular-nums"],
  },
  tileLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  collectionSection: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  placesLabel: {
    marginTop: SPACING.sm,
  },
  collectionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    borderRadius: ROUNDNESS.lg,
    padding: SPACING.md,
  },
  collectionIcon: {
    width: 36,
    height: 36,
    borderRadius: ROUNDNESS.md,
    alignItems: "center",
    justifyContent: "center",
  },
  collectionText: {
    flex: 1,
  },
  collectionName: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  collectionCount: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  noPlaces: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
});
