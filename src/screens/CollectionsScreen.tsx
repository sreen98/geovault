import React, { useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  StatusBar,
  Pressable,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCollectionsStore } from "../stores/collections.store";
import { CollectionCard } from "../components/CollectionCard";
import { CollectionSummary } from "../types/collection.types";
import { SPACING } from "../constants/theme";
import { pluralize } from "../utils/plural";
import { useTheme } from "../contexts/ThemeContext";

export function CollectionsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { collections, loadCollections } = useCollectionsStore();

  useFocusEffect(
    useCallback(() => {
      loadCollections();
    }, [loadCollections])
  );

  const keyExtractor = useCallback((item: CollectionSummary) => item.id, []);

  const handlePress = useCallback((collection: CollectionSummary): void => {
    router.push(`/collection/${collection.id}`);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: CollectionSummary }) => (
      <CollectionCard collection={item} onPress={() => handlePress(item)} />
    ),
    [handlePress]
  );

  const hasCollections = collections.length > 0;

  const ListHeader = useCallback(
    () => (
      <View style={styles.headerContent}>
        <Text style={[styles.appTitle, { color: colors.onSurface }]}>
          Collections
        </Text>
        <Text style={[styles.headerCount, { color: colors.onSurfaceMuted }]}>
          {pluralize(collections.length, "collection")}
        </Text>
      </View>
    ),
    [colors, collections.length]
  );

  const addButton = (
    <Pressable
      onPress={() => router.push("/collection/new")}
      accessibilityRole="button"
      accessibilityLabel="Create new collection"
      className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-accent items-center justify-center z-10"
    >
      <Ionicons name="add" size={28} color={colors.background} />
    </Pressable>
  );

  if (!hasCollections) {
    return (
      <View
        style={[
          styles.container,
          { paddingTop: insets.top, backgroundColor: colors.background },
        ]}
      >
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <View style={styles.emptyScreen}>
          <Text style={[styles.appTitle, { color: colors.onSurface }]}>
            Collections
          </Text>
          <View style={styles.heroSection}>
            <Text style={[styles.heroTitle, { color: colors.onSurface }]}>
              Grouped
            </Text>
            <Text style={[styles.heroTitleAccent, { color: colors.accent }]}>
              Places.
            </Text>
            <Text
              style={[styles.heroSubtitle, { color: colors.onSurfaceVariant }]}
            >
              Club places into a trip, a city,{"\n"}or a list worth keeping.
            </Text>
          </View>
          <View style={styles.emptyCenter}>
            <Ionicons
              name="albums-outline"
              size={48}
              color={colors.onSurfaceMuted}
            />
            <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>
              No collections yet
            </Text>
            <Text
              style={[styles.emptySubtitle, { color: colors.onSurfaceMuted }]}
            >
              Tap the + button to group your first set of places.
            </Text>
          </View>
        </View>
        {addButton}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, backgroundColor: colors.background },
      ]}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <FlatList
        data={collections}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeader}
        renderItem={renderItem}
        style={styles.flatList}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        maxToRenderPerBatch={15}
        windowSize={10}
        initialNumToRender={15}
      />
      {addButton}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  flatList: {
    flex: 1,
    zIndex: 1,
  },
  headerContent: {
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  appTitle: {
    fontSize: 32,
    fontFamily: "Manrope_700Bold",
    letterSpacing: -0.8,
    paddingHorizontal: SPACING.lg,
  },
  headerCount: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    paddingHorizontal: SPACING.lg,
    marginTop: 4,
  },
  emptyScreen: {
    flex: 1,
    paddingTop: SPACING.lg,
  },
  emptyCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.xxl * 2,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Manrope_700Bold",
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingHorizontal: SPACING.xl,
  },
  heroSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  heroTitle: {
    fontSize: 44,
    fontFamily: "Manrope_700Bold",
    letterSpacing: -1.5,
    lineHeight: 50,
  },
  heroTitleAccent: {
    fontSize: 44,
    fontFamily: "Manrope_700Bold",
    letterSpacing: -1.5,
    lineHeight: 50,
    fontStyle: "italic",
  },
  heroSubtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
    marginTop: SPACING.sm,
  },
  listContent: {
    paddingTop: SPACING.sm,
    paddingBottom: 120,
  },
});
