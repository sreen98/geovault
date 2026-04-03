import React, { useRef, useCallback, useEffect } from "react";
import {
  View,
  TextInput,
  FlatList,
  StyleSheet,
  Text,
  Platform,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSearchStore } from "../stores/search.store";
import { PlaceCard } from "../components/PlaceCard";
import { EmptyState } from "../components/EmptyState";
import { Place } from "../types/place.types";
import { SPACING, ROUNDNESS } from "../constants/theme";
import { useTheme } from "../contexts/ThemeContext";

export function SearchScreen() {
  const { query, results, hasMore, isLoadingMore, setQuery, loadMore } =
    useSearchStore();
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
              autoFocus
              accessibilityLabel="Search places"
            />
          </View>
        </View>

        <FlatList
          data={results}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            results.length === 0 && styles.emptyList,
          ]}
          ListEmptyComponent={
            <EmptyState
              icon="search-outline"
              title={query ? "No results found" : "Explore your vault"}
              subtitle={
                query
                  ? "Try different keywords or check your spelling."
                  : "Start typing to find saved locations, your favorite dishes, or places you've avoided."
              }
            />
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
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
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
});
