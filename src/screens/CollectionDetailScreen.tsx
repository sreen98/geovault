import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import ReorderableList, {
  ReorderableListReorderEvent,
  ReorderableListRenderItemInfo,
} from "react-native-reorderable-list";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCollectionsStore } from "../stores/collections.store";
import { CollectionPlaceRow } from "../components/CollectionPlaceRow";
import { PlacePickerDialog } from "../components/PlacePickerDialog";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { StatusDialog } from "../components/StatusDialog";
import { Place } from "../types/place.types";
import { ROUNDNESS, SPACING } from "../constants/theme";
import { formatDateRange } from "../utils/date";
import { pluralize } from "../utils/plural";
import { useTheme } from "../contexts/ThemeContext";

const DESCRIPTION_CLAMP_LENGTH = 140;

export function CollectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const {
    activeCollection,
    activePlaces,
    activePlaceCount,
    activeHasMore,
    activeIsLoadingMore,
    openCollection,
    loadMoreActivePlaces,
    addPlacesToActive,
    removePlaceFromActive,
    movePlaceInActive,
    reorderActivePlaces,
    deleteCollection,
  } = useCollectionsStore();

  const [isReordering, setIsReordering] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<Place | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (id) {
        openCollection(id);
      }
    }, [id, openCollection])
  );

  const handleAddPlaces = useCallback(
    (placeIds: string[]): void => {
      setShowPicker(false);
      const added = addPlacesToActive(placeIds);
      if (added > 0) {
        setStatusMsg(`Added ${pluralize(added, "place")} to this collection.`);
      }
    },
    [addPlacesToActive]
  );

  const confirmRemove = useCallback((): void => {
    if (!removeTarget) return;
    removePlaceFromActive(removeTarget.id);
    setRemoveTarget(null);
  }, [removeTarget, removePlaceFromActive]);

  const confirmDeleteCollection = useCallback((): void => {
    if (!activeCollection) return;
    setShowDeleteConfirm(false);
    router.back();
    deleteCollection(activeCollection.id);
  }, [activeCollection, deleteCollection]);

  const keyExtractor = useCallback((item: Place) => item.id, []);

  const handleReorder = useCallback(
    ({ from, to }: ReorderableListReorderEvent): void => {
      reorderActivePlaces(from, to);
    },
    [reorderActivePlaces]
  );

  const renderItem = useCallback(
    ({ item, index }: ReorderableListRenderItemInfo<Place>) => (
      <CollectionPlaceRow
        place={item}
        position={index + 1}
        isFirst={index === 0}
        isLast={index === activePlaceCount - 1}
        isReordering={isReordering}
        onPress={() => router.push(`/place/${item.id}`)}
        onRemove={() => setRemoveTarget(item)}
        onMove={(direction) => movePlaceInActive(item.id, direction)}
      />
    ),
    [activePlaceCount, isReordering, movePlaceInActive]
  );

  if (!activeCollection) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <Ionicons name="albums-outline" size={44} color={colors.onSurfaceMuted} />
        <Text style={[styles.notFoundText, { color: colors.onSurfaceVariant }]}>
          Collection not found
        </Text>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={[styles.backLink, { borderColor: colors.border }]}
        >
          <Text style={[styles.backLinkText, { color: colors.onSurface }]}>
            Go back
          </Text>
        </Pressable>
      </View>
    );
  }

  const dateRange = formatDateRange(
    activeCollection.startDate,
    activeCollection.endDate
  );
  const accent = activeCollection.color;
  const isLongDescription =
    activeCollection.description.length > DESCRIPTION_CLAMP_LENGTH;

  const ListHeader = (
    <View style={styles.headerContent}>
      <View style={styles.titleRow}>
        <View style={[styles.iconCircle, { backgroundColor: `${accent}22` }]}>
          <Ionicons name={activeCollection.icon} size={22} color={accent} />
        </View>
        <Text
          style={[styles.name, { color: colors.onSurface }]}
          numberOfLines={2}
        >
          {activeCollection.name}
        </Text>
      </View>

      <View style={styles.metaRow}>
        <Text style={[styles.count, { color: accent }]}>
          {pluralize(activePlaceCount, "place")}
        </Text>
        {dateRange ? (
          <>
            <Text style={[styles.metaDot, { color: colors.onSurfaceMuted }]}>
              {"•"}
            </Text>
            <Text style={[styles.dateRange, { color: colors.onSurfaceMuted }]}>
              {dateRange}
            </Text>
          </>
        ) : null}
      </View>

      {activeCollection.description ? (
        <View style={styles.descriptionBlock}>
          <Text
            style={[styles.description, { color: colors.onSurfaceVariant }]}
            numberOfLines={descriptionExpanded ? undefined : 3}
          >
            {activeCollection.description}
          </Text>
          {isLongDescription ? (
            <Pressable
              onPress={() => setDescriptionExpanded((current) => !current)}
              accessibilityRole="button"
              accessibilityLabel={
                descriptionExpanded ? "Show less" : "Show full description"
              }
              hitSlop={8}
            >
              <Text style={[styles.showMore, { color: accent }]}>
                {descriptionExpanded ? "Show less" : "Show more"}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {isReordering ? (
        <Text style={[styles.reorderHint, { color: colors.onSurfaceMuted }]}>
          Press and hold a place to drag it into position.
        </Text>
      ) : null}

      <View style={styles.actionRow}>
        <Pressable
          onPress={() => setShowPicker(true)}
          accessibilityRole="button"
          accessibilityLabel="Add places to this collection"
          style={[styles.primaryAction, { backgroundColor: accent }]}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.primaryActionText}>Add Places</Text>
        </Pressable>

        {activePlaceCount > 1 ? (
          <Pressable
            onPress={() => setIsReordering((current) => !current)}
            accessibilityRole="button"
            accessibilityLabel={
              isReordering ? "Finish reordering" : "Reorder places"
            }
            accessibilityState={{ selected: isReordering }}
            style={[
              styles.secondaryAction,
              {
                borderColor: isReordering ? accent : colors.border,
                backgroundColor: isReordering ? `${accent}22` : "transparent",
              },
            ]}
          >
            <Ionicons
              name={isReordering ? "checkmark" : "swap-vertical"}
              size={18}
              color={isReordering ? accent : colors.onSurfaceVariant}
            />
            <Text
              style={[
                styles.secondaryActionText,
                { color: isReordering ? accent : colors.onSurfaceVariant },
              ]}
            >
              {isReordering ? "Done" : "Reorder"}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );

  const ListEmpty = (
    <View style={styles.empty}>
      <Ionicons name="location-outline" size={44} color={colors.onSurfaceMuted} />
      <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>
        No places yet
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.onSurfaceMuted }]}>
        Add saved places to keep this collection together.
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <View style={[styles.topBar, { paddingTop: insets.top + SPACING.sm }]}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={26} color={colors.onSurface} />
        </Pressable>
        <Pressable
          onPress={() => router.push(`/collection/edit/${activeCollection.id}`)}
          accessibilityRole="button"
          accessibilityLabel="Edit collection"
          hitSlop={12}
        >
          <Ionicons name="create-outline" size={24} color={colors.onSurface} />
        </Pressable>
      </View>

      <ReorderableList
        data={activePlaces}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        onReorder={handleReorder}
        dragEnabled={isReordering}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        ListFooterComponent={
          <View>
            {activeIsLoadingMore ? (
              <ActivityIndicator
                size="small"
                color={accent}
                style={styles.loadingMore}
              />
            ) : null}
            <View style={styles.deleteRow}>
              <Pressable
                onPress={() => setShowDeleteConfirm(true)}
                accessibilityRole="button"
                accessibilityLabel="Delete collection"
                style={[styles.deleteButton, { borderColor: colors.danger }]}
              >
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
                <Text style={[styles.deleteText, { color: colors.danger }]}>
                  Delete Collection
                </Text>
              </Pressable>
            </View>
          </View>
        }
        contentContainerStyle={styles.listContent}
        onEndReached={activeHasMore ? loadMoreActivePlaces : undefined}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        maxToRenderPerBatch={15}
        windowSize={10}
        initialNumToRender={15}
      />

      <PlacePickerDialog
        visible={showPicker}
        collectionId={activeCollection.id}
        collectionName={activeCollection.name}
        onConfirm={handleAddPlaces}
        onCancel={() => setShowPicker(false)}
      />

      <ConfirmDialog
        visible={removeTarget !== null}
        title="Remove from Collection"
        message={`Remove "${removeTarget?.name ?? ""}" from ${activeCollection.name}? The place stays saved in your vault.`}
        confirmLabel="Remove"
        confirmIcon="remove-circle-outline"
        onConfirm={confirmRemove}
        onCancel={() => setRemoveTarget(null)}
      />

      <ConfirmDialog
        visible={showDeleteConfirm}
        title="Delete Collection"
        message={`Delete "${activeCollection.name}"? The ${pluralize(activePlaceCount, "place")} inside stay saved in your vault.`}
        onConfirm={confirmDeleteCollection}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {statusMsg ? (
        <StatusDialog
          visible
          title="Places Added"
          message={statusMsg}
          type="success"
          onDismiss={() => setStatusMsg(null)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.md,
  },
  notFoundText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  backLink: {
    borderWidth: 1,
    borderRadius: ROUNDNESS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  backLinkText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xs,
  },
  headerContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: ROUNDNESS.full,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    flex: 1,
    fontSize: 28,
    fontFamily: "Manrope_700Bold",
    letterSpacing: -0.8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: SPACING.sm,
  },
  count: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  metaDot: {
    fontSize: 13,
  },
  dateRange: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flexShrink: 1,
  },
  descriptionBlock: {
    marginTop: SPACING.md,
    gap: 4,
  },
  description: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 21,
  },
  showMore: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  reorderHint: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
    marginTop: SPACING.md,
  },
  actionRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  primaryAction: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13,
    borderRadius: ROUNDNESS.md,
  },
  primaryActionText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
  secondaryAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13,
    paddingHorizontal: SPACING.md,
    borderRadius: ROUNDNESS.md,
    borderWidth: 1,
  },
  secondaryActionText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  listContent: {
    paddingBottom: 120,
  },
  empty: {
    alignItems: "center",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xxl,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: "Manrope_700Bold",
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  loadingMore: {
    paddingVertical: SPACING.lg,
  },
  deleteRow: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    paddingVertical: 14,
    borderRadius: ROUNDNESS.md,
    borderWidth: 1,
  },
  deleteText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
});
