import React, { useRef, useCallback, useEffect } from "react";
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
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSearchStore } from "../stores/search.store";
import { PlaceCard } from "../components/PlaceCard";
import { EmptyState } from "../components/EmptyState";
import { Place } from "../types/place.types";
import { pluralize } from "../utils/plural";
import { SPACING, ROUNDNESS } from "../constants/theme";
import { useTheme } from "../contexts/ThemeContext";

export function SearchScreen() {
  const {
    query,
    results,
    collectionResults,
    hasMore,
    isLoadingMore,
    setQuery,
    loadMore,
  } = useSearchStore();
  const { colors, isDark } = useTheme();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleQueryChange = useCallback(
    (text: string): void => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setQuery(text);
      }, 300);
    },
    [setQuery]
  );

  const keyExtractor = useCallback((item: Place) => item.id, []);

  const renderItem = useCallback(
    ({ item }: { item: Place }) => (
      <PlaceCard
        place={item}
        onPress={() => router.push(`/place/${item.id}`)}
      />
    ),
    []
  );

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
            onPress={() => router.push(`/collection/${collection.id}`)}
            accessibilityRole="button"
            accessibilityLabel={`Open collection ${collection.name}`}
            style={[
              styles.collectionRow,
              {
                backgroundColor: colors.surfaceCard,
                borderLeftColor: collection.color,
              },
            ]}
          >
            <Ionicons
              name={collection.icon}
              size={18}
              color={collection.color}
            />
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
  }, [collectionResults, colors, hasCollectionResults, results.length]);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.onSurface }]}>
            Search
          </Text>
          <View
            style={[
              styles.searchContainer,
              { backgroundColor: colors.surfaceContainerLow },
            ]}
          >
            <Ionicons
              name="search"
              size={20}
              color={colors.secondary}
              style={styles.searchIcon}
            />
            <TextInput
              style={[styles.searchInput, { color: colors.onSurface }]}
              placeholder="Names, notes, or tags..."
              placeholderTextColor={colors.secondary}
              defaultValue={query}
              onChangeText={handleQueryChange}
              autoCapitalize="none"
              returnKeyType="search"
              clearButtonMode="while-editing"
              accessibilityLabel="Search places"
            />
          </View>
        </View>

        <FlatList
          data={results}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={[
            styles.listContent,
            results.length === 0 && !hasCollectionResults && styles.emptyList,
          ]}
          ListEmptyComponent={
            hasCollectionResults ? (
              <Text
                style={[styles.noPlaces, { color: colors.onSurfaceMuted }]}
              >
                No matching places.
              </Text>
            ) : (
              <EmptyState
                icon="search-outline"
                title={query ? "No results found" : "Explore your vault"}
                subtitle={
                  query
                    ? "Try different keywords or check your spelling."
                    : "Start typing to find saved locations, your favorite dishes, or places you've avoided."
                }
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
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 34,
    fontFamily: "Manrope_700Bold",
    marginBottom: SPACING.md,
    letterSpacing: -0.5,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: ROUNDNESS.lg,
    paddingHorizontal: SPACING.md,
    height: 52,
  },
  searchIcon: {
    marginRight: SPACING.sm,
    opacity: 0.6,
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
  collectionSection: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
  },
  placesLabel: {
    marginTop: SPACING.sm,
  },
  collectionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    borderRadius: ROUNDNESS.md,
    borderLeftWidth: 3,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  collectionText: {
    flex: 1,
  },
  collectionName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  collectionCount: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  noPlaces: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
});
