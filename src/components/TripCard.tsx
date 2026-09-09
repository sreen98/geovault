import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  PanResponder,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Trip } from "../types/trip.types";
import { ROUNDNESS, SPACING } from "../constants/theme";
import { DEFAULT_TRIP_COLOR, DEFAULT_TRIP_ICON } from "../constants/trips";
import { formatDateRange } from "../utils/date";
import { useTheme } from "../contexts/ThemeContext";

interface TripCardProps {
  trip: Trip;
  onPress: () => void;
  onDelete?: () => void;
}

const SWIPE_THRESHOLD = -80;

type IoniconsName = keyof typeof Ionicons.glyphMap;

function isIoniconName(value: string): value is IoniconsName {
  return value in Ionicons.glyphMap;
}

export const TripCard = React.memo(function TripCard({
  trip,
  onPress,
  onDelete,
}: TripCardProps) {
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

  const tripColor = trip.color || DEFAULT_TRIP_COLOR;
  const iconName: IoniconsName =
    trip.icon && isIoniconName(trip.icon) ? trip.icon : DEFAULT_TRIP_ICON;
  const dateRange = formatDateRange(trip.startDate, trip.endDate);
  const count = trip.placeCount ?? 0;

  return (
    <View style={styles.wrapper}>
      {showDeleteTap && (
        <View style={[styles.deleteAction, { backgroundColor: colors.danger }]}>
          <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
          <Text style={styles.deleteActionText}>Delete</Text>
        </View>
      )}

      <Animated.View
        style={{ transform: [{ translateX }] }}
        {...panResponder.panHandlers}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surfaceCard,
              borderLeftColor: tripColor,
            },
          ]}
        >
          <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`${trip.name}, ${count} places`}
            style={styles.cardBody}
          >
            <View style={[styles.iconCircle, { backgroundColor: tripColor }]}>
              <Ionicons name={iconName} size={22} color="#FFFFFF" />
            </View>

            <View style={styles.info}>
              <Text
                style={[styles.name, { color: colors.onSurface }]}
                numberOfLines={1}
              >
                {trip.name}
              </Text>
              {dateRange ? (
                <View style={styles.infoItem}>
                  <Ionicons name="calendar-outline" size={13} color={tripColor} />
                  <Text
                    style={[styles.infoText, { color: colors.onSurfaceVariant }]}
                    numberOfLines={1}
                  >
                    {dateRange}
                  </Text>
                </View>
              ) : null}
              <View style={styles.infoItem}>
                <Ionicons
                  name="location-outline"
                  size={12}
                  color={colors.onSurfaceMuted}
                />
                <Text style={[styles.countText, { color: colors.onSurfaceMuted }]}>
                  {count} {count === 1 ? "PLACE" : "PLACES"}
                </Text>
              </View>
            </View>

            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.onSurfaceMuted}
            />
          </Pressable>
        </View>
      </Animated.View>

      {showDeleteTap && (
        <Pressable
          style={styles.deleteTap}
          onPress={onDelete}
          accessibilityRole="button"
          accessibilityLabel="Delete trip"
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
    alignItems: "center",
    padding: SPACING.md,
    gap: SPACING.md,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: ROUNDNESS.full,
    justifyContent: "center",
    alignItems: "center",
  },
  info: {
    flex: 1,
    gap: SPACING.xs,
  },
  name: {
    fontSize: 20,
    fontFamily: "Manrope_700Bold",
    letterSpacing: -0.3,
    marginBottom: 2,
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
  countText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
  },
});
