import React, { useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  AccessibilityActionEvent,
  AccessibilityActionInfo,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useReorderableDrag } from "react-native-reorderable-list";
import { Place, PlaceCategory } from "../types/place.types";
import { CATEGORY_COLORS, ROUNDNESS, SPACING } from "../constants/theme";
import { useTheme } from "../contexts/ThemeContext";

interface CollectionPlaceRowProps {
  place: Place;
  /** 1-based position shown while reordering. */
  position: number;
  isFirst: boolean;
  isLast: boolean;
  isReordering: boolean;
  onPress: () => void;
  onRemove: () => void;
  /** Backs the screen-reader move actions; dragging goes through the list. */
  onMove: (direction: "up" | "down") => void;
}

export const CollectionPlaceRow = React.memo(function CollectionPlaceRow({
  place,
  position,
  isFirst,
  isLast,
  isReordering,
  onPress,
  onRemove,
  onMove,
}: CollectionPlaceRowProps) {
  const { colors } = useTheme();
  // Only valid inside a ReorderableList cell, which is why the detail screen
  // always renders ReorderableList and toggles dragEnabled instead of swapping
  // the list component out.
  const drag = useReorderableDrag();

  const categoryColor =
    CATEGORY_COLORS[place.category as PlaceCategory] ?? CATEGORY_COLORS.Other;

  // Dragging is a pointer gesture a screen reader cannot perform, so the same
  // move is exposed as explicit accessibility actions at either end.
  const accessibilityActions: AccessibilityActionInfo[] | undefined =
    isReordering
      ? [
          ...(isFirst ? [] : [{ name: "moveUp", label: "Move up" }]),
          ...(isLast ? [] : [{ name: "moveDown", label: "Move down" }]),
        ]
      : undefined;

  const handleAccessibilityAction = useCallback(
    (event: AccessibilityActionEvent): void => {
      if (event.nativeEvent.actionName === "moveUp") {
        onMove("up");
      } else if (event.nativeEvent.actionName === "moveDown") {
        onMove("down");
      }
    },
    [onMove]
  );

  return (
    <View style={styles.wrapper}>
      <View
        accessible={isReordering}
        accessibilityLabel={
          isReordering
            ? `${place.name}, position ${position}`
            : undefined
        }
        accessibilityActions={accessibilityActions}
        onAccessibilityAction={handleAccessibilityAction}
        style={[
          styles.card,
          {
            backgroundColor: colors.surfaceCard,
            borderLeftColor: categoryColor,
          },
        ]}
      >
        {isReordering ? (
          <View
            style={[
              styles.positionBadge,
              { backgroundColor: colors.surfaceElevated },
            ]}
          >
            <Text
              style={[styles.positionText, { color: colors.onSurfaceVariant }]}
            >
              {position}
            </Text>
          </View>
        ) : null}

        <Pressable
          onPress={isReordering ? undefined : onPress}
          onLongPress={isReordering ? drag : undefined}
          delayLongPress={200}
          accessibilityRole="button"
          accessibilityLabel={`${place.name}, ${place.category}`}
          style={styles.textBlock}
        >
          <Text
            style={[styles.name, { color: colors.onSurface }]}
            numberOfLines={1}
          >
            {place.name}
          </Text>
          <View style={styles.metaRow}>
            <Text style={[styles.category, { color: categoryColor }]}>
              {place.category}
            </Text>
            {place.location ? (
              <>
                <Text style={[styles.dot, { color: colors.onSurfaceMuted }]}>
                  {"•"}
                </Text>
                <Text
                  style={[styles.location, { color: colors.onSurfaceMuted }]}
                  numberOfLines={1}
                >
                  {place.location}
                </Text>
              </>
            ) : null}
          </View>
        </Pressable>

        {isReordering ? (
          <Pressable
            onLongPress={drag}
            delayLongPress={120}
            accessibilityRole="button"
            accessibilityLabel={`Drag ${place.name} to reorder`}
            hitSlop={8}
            style={styles.iconButton}
          >
            <Ionicons
              name="reorder-three-outline"
              size={24}
              color={colors.onSurfaceVariant}
            />
          </Pressable>
        ) : (
          <Pressable
            onPress={onRemove}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${place.name} from this collection`}
            hitSlop={8}
            style={styles.iconButton}
          >
            <Ionicons
              name="remove-circle-outline"
              size={22}
              color={colors.onSurfaceMuted}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    borderRadius: ROUNDNESS.md,
    borderLeftWidth: 3,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  positionBadge: {
    width: 26,
    height: 26,
    borderRadius: ROUNDNESS.full,
    alignItems: "center",
    justifyContent: "center",
  },
  positionText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  category: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  dot: {
    fontSize: 12,
  },
  location: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    flexShrink: 1,
  },
  iconButton: {
    padding: 4,
  },
});
