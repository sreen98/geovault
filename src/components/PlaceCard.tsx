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
import { formatRelativeDate } from "../utils/date";
import { useTheme } from "../contexts/ThemeContext";

interface PlaceCardProps {
  place: Place;
  onPress: () => void;
  onDelete?: () => void;
}

const SWIPE_THRESHOLD = -80;

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
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surfaceCard,
              borderLeftColor: categoryColor,
            },
          ]}
        >
          <View style={styles.cardBody}>
            {/* Left: info */}
            <Pressable
              onPress={onPress}
              accessibilityRole="button"
              accessibilityLabel={`${place.name}, ${place.category}`}
              style={[styles.leftSection]}
            >
              <Text
                style={[styles.name, { color: colors.onSurface }]}
                numberOfLines={1}
              >
                {place.name}
              </Text>
              {place.location ? (
                <View style={styles.infoItem}>
                  <Ionicons name="location" size={13} color={categoryColor} />
                  <Text
                    style={[styles.infoText, { color: colors.onSurfaceVariant }]}
                    numberOfLines={1}
                  >
                    {place.location}
                  </Text>
                </View>
              ) : null}
              <View style={styles.infoItem}>
                <Ionicons
                  name="time-outline"
                  size={12}
                  color={colors.onSurfaceMuted}
                />
                <Text
                  style={[styles.dateText, { color: colors.onSurfaceMuted }]}
                >
                  {formatRelativeDate(place.createdAt).toUpperCase()}
                </Text>
              </View>
            </Pressable>

            {/* Vertical separator */}
            <View
              style={[
                styles.vertSep,
                { backgroundColor: colors.surfaceContainerHigh },
              ]}
            />

            {/* Right: map CTA */}
            <Pressable
              onPress={openInMaps}
              accessibilityRole="link"
              accessibilityLabel="Open in Maps"
              style={styles.mapCta}
            >
              <Ionicons name="navigate" size={22} color={colors.accent} />
              <Text style={[styles.mapCtaText, { color: colors.onSurfaceMuted }]}>
                Map
              </Text>
            </Pressable>
          </View>
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
    paddingBottom: SPACING.md,
    position: "relative",
  },
  deleteAction: {
    position: "absolute",
    top: 0,
    bottom: SPACING.md,
    right: SPACING.lg,
    width: 100,
    borderTopRightRadius: ROUNDNESS.md,
    borderBottomRightRadius: ROUNDNESS.md,
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  deleteActionText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  deleteTap: {
    position: "absolute",
    top: 0,
    bottom: SPACING.md,
    right: SPACING.lg,
    width: 100,
  },
  card: {
    borderRadius: ROUNDNESS.md,
    borderLeftWidth: 4,
    overflow: "hidden",
  },
  cardBody: {
    flexDirection: "row",
  },
  leftSection: {
    flex: 1,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  name: {
    fontSize: 22,
    fontFamily: "Manrope_700Bold",
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  vertSep: {
    width: 1,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  infoText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  dateText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
  },
  mapCta: {
    width: 72,
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  mapCtaText: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
});
