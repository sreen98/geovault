import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  PanResponder,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Place, PlaceCategory } from "../types/place.types";
import { CATEGORY_COLORS, ROUNDNESS, SPACING } from "../constants/theme";
import { CATEGORY_ICONS } from "../constants/categories";
import { formatRelativeDate } from "../utils/date";
import { useTheme } from "../contexts/ThemeContext";

interface PlaceCardProps {
  place: Place;
  onPress: () => void;
  onDelete?: () => void;
}

const SWIPE_THRESHOLD = -80;
const CARD_GAP = SPACING.sm + SPACING.xs;

export const PlaceCard = React.memo(function PlaceCard({ place, onPress, onDelete }: PlaceCardProps) {
  const { colors } = useTheme();
  const translateX = useRef(new Animated.Value(0)).current;
  const isSwipedOpen = useRef(false);
  const [showDeleteTap, setShowDeleteTap] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gs) =>
        Math.abs(gs.dx) > 10 && Math.abs(gs.dx) > Math.abs(gs.dy),
      onPanResponderMove: (_evt, gs) => {
        if (gs.dx < 0) {
          translateX.setValue(Math.max(gs.dx, -100));
        } else if (isSwipedOpen.current) {
          translateX.setValue(Math.min(gs.dx - 100, 0));
        }
      },
      onPanResponderRelease: (_evt, gs) => {
        if (gs.dx < SWIPE_THRESHOLD) {
          Animated.spring(translateX, {
            toValue: -100,
            useNativeDriver: true,
          }).start();
          isSwipedOpen.current = true;
          setShowDeleteTap(true);
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
          isSwipedOpen.current = false;
          setShowDeleteTap(false);
        }
      },
    })
  ).current;

  const categoryColor =
    CATEGORY_COLORS[place.category as PlaceCategory] || CATEGORY_COLORS.Other;
  const categoryIcon =
    CATEGORY_ICONS[place.category as PlaceCategory] || CATEGORY_ICONS.Other;

  const openInMaps = (): void => {
    if (place.sourceUrl) {
      Linking.openURL(place.sourceUrl);
    } else {
      Linking.openURL(
        `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`
      );
    }
  };

  return (
    <View style={styles.wrapper}>
      {/* Delete action behind the card — only visible when swiped */}
      {showDeleteTap && (
        <View style={[styles.deleteAction, { backgroundColor: colors.danger }]}>
          <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
          <Text style={styles.deleteActionText}>Delete</Text>
        </View>
      )}

      {/* Swipeable card */}
      <Animated.View
        style={{ transform: [{ translateX }] }}
        {...panResponder.panHandlers}
      >
        <View style={[styles.card, { backgroundColor: colors.surfaceCard }]}>
          {/* Left: category badge + info */}
          <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`${place.name}, ${place.category}`}
            style={styles.leftSection}
          >
            <View style={[styles.categoryBadge, { backgroundColor: `${categoryColor}26` }]}>
              <Ionicons name={categoryIcon} size={20} color={categoryColor} />
            </View>
            <View style={styles.textBlock}>
              <Text
                style={[styles.name, { color: colors.onSurface }]}
                numberOfLines={1}
              >
                {place.name}
              </Text>
              {place.location ? (
                <Text
                  style={[styles.infoText, { color: colors.onSurfaceVariant }]}
                  numberOfLines={1}
                >
                  {place.location}
                </Text>
              ) : null}
              <Text
                style={[styles.metaText, { color: colors.onSurfaceMuted }]}
                numberOfLines={1}
              >
                <Text style={{ color: categoryColor }}>{place.category}</Text>
                {`  ·  ${formatRelativeDate(place.createdAt)}`}
              </Text>
            </View>
          </Pressable>

          {/* Right: map CTA */}
          <Pressable
            onPress={openInMaps}
            accessibilityRole="link"
            accessibilityLabel={`Open ${place.name} in Maps`}
            style={({ pressed }) => [styles.mapCta, pressed && styles.pressed]}
          >
            <View style={[styles.mapCircle, { backgroundColor: colors.accentMuted }]}>
              <Ionicons name="navigate" size={20} color={colors.accent} />
            </View>
          </Pressable>
        </View>
      </Animated.View>

      {/* Delete tap target — only when swiped */}
      {showDeleteTap && (
        <Pressable
          style={styles.deleteTap}
          onPress={onDelete}
          accessibilityRole="button"
          accessibilityLabel="Delete place"
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: CARD_GAP,
    position: "relative",
  },
  deleteAction: {
    position: "absolute",
    top: 0,
    bottom: CARD_GAP,
    right: SPACING.lg,
    width: 100,
    borderTopRightRadius: ROUNDNESS.lg,
    borderBottomRightRadius: ROUNDNESS.lg,
    justifyContent: "center",
    alignItems: "center",
    gap: SPACING.xs,
  },
  deleteActionText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  deleteTap: {
    position: "absolute",
    top: 0,
    bottom: CARD_GAP,
    right: SPACING.lg,
    width: 100,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: ROUNDNESS.lg,
    overflow: "hidden",
  },
  leftSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    paddingVertical: SPACING.md,
    paddingLeft: SPACING.md,
  },
  categoryBadge: {
    width: 44,
    height: 44,
    borderRadius: ROUNDNESS.md,
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: {
    flex: 1,
    gap: SPACING.xs,
  },
  name: {
    fontSize: 17,
    fontFamily: "Manrope_700Bold",
    letterSpacing: -0.3,
  },
  infoText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  metaText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  mapCta: {
    width: 64,
    alignSelf: "stretch",
    justifyContent: "center",
    alignItems: "center",
  },
  mapCircle: {
    width: 44,
    height: 44,
    borderRadius: ROUNDNESS.full,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.7,
  },
});
