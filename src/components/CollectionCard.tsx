import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CollectionSummary } from "../types/collection.types";
import { ROUNDNESS, SPACING } from "../constants/theme";
import { formatDateRange } from "../utils/date";
import { pluralize } from "../utils/plural";
import { useTheme } from "../contexts/ThemeContext";

interface CollectionCardProps {
  collection: CollectionSummary;
  onPress: () => void;
}

export const CollectionCard = React.memo(function CollectionCard({
  collection,
  onPress,
}: CollectionCardProps) {
  const { colors } = useTheme();

  const dateRange = formatDateRange(collection.startDate, collection.endDate);
  const countLabel = pluralize(collection.placeCount, "place");

  // The preview line is a hint, not a list — anything past the first few names
  // is summarised rather than truncated mid-word.
  const remaining = collection.placeCount - collection.previewNames.length;
  const previewLine =
    collection.previewNames.length > 0
      ? collection.previewNames.join("  •  ") +
        (remaining > 0 ? `  •  +${remaining} more` : "")
      : "";

  return (
    <View style={styles.wrapper}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${collection.name}, ${countLabel}`}
        style={[
          styles.card,
          {
            backgroundColor: colors.surfaceCard,
            borderLeftColor: collection.color,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: `${collection.color}22` },
            ]}
          >
            <Ionicons name={collection.icon} size={20} color={collection.color} />
          </View>

          <View style={styles.titleBlock}>
            <Text
              style={[styles.name, { color: colors.onSurface }]}
              numberOfLines={2}
            >
              {collection.name}
            </Text>
            <View style={styles.metaRow}>
              <Text style={[styles.count, { color: collection.color }]}>
                {countLabel}
              </Text>
              {dateRange ? (
                <>
                  <Text style={[styles.metaDot, { color: colors.onSurfaceMuted }]}>
                    {"•"}
                  </Text>
                  <Text
                    style={[styles.dateRange, { color: colors.onSurfaceMuted }]}
                    numberOfLines={1}
                  >
                    {dateRange}
                  </Text>
                </>
              ) : null}
            </View>
          </View>

          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.onSurfaceMuted}
            style={styles.chevron}
          />
        </View>

        {collection.description ? (
          <Text
            style={[styles.description, { color: colors.onSurfaceVariant }]}
            numberOfLines={2}
          >
            {collection.description}
          </Text>
        ) : null}

        {previewLine ? (
          <Text
            style={[styles.preview, { color: colors.onSurfaceMuted }]}
            numberOfLines={1}
          >
            {previewLine}
          </Text>
        ) : null}
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  card: {
    borderRadius: ROUNDNESS.lg,
    borderLeftWidth: 3,
    padding: SPACING.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: ROUNDNESS.full,
    alignItems: "center",
    justifyContent: "center",
  },
  titleBlock: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 17,
    fontFamily: "Manrope_700Bold",
    letterSpacing: -0.3,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  count: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  metaDot: {
    fontSize: 12,
  },
  dateRange: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    flexShrink: 1,
  },
  chevron: {
    marginLeft: SPACING.xs,
  },
  description: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
    marginTop: SPACING.sm,
  },
  preview: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: SPACING.sm,
  },
});
