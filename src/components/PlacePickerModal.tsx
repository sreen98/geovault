import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  FlatList,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PlacesRepository } from "../db/places.repository";
import { Place, PlaceCategory } from "../types/place.types";
import { CATEGORY_COLORS, ROUNDNESS, SPACING } from "../constants/theme";
import { EmptyState } from "./EmptyState";
import { useTheme } from "../contexts/ThemeContext";

interface PlacePickerModalProps {
  visible: boolean;
  initialSelectedIds: string[];
  onConfirm: (selectedIds: string[]) => void;
  onClose: () => void;
}

const PAGE_SIZE = 30;

export function PlacePickerModal({
  visible,
  initialSelectedIds,
  onConfirm,
  onClose,
}: PlacePickerModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [places, setPlaces] = useState<Place[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (visible) {
      const first = PlacesRepository.getPaginated(PAGE_SIZE, 0);
      setPlaces(first);
      setHasMore(first.length === PAGE_SIZE);
      setSelected(new Set(initialSelectedIds));
    }
    // Re-sync only when the modal is (re)opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const loadMore = useCallback((): void => {
    if (!hasMore) return;
    const next = PlacesRepository.getPaginated(PAGE_SIZE, places.length);
    setPlaces((prev) => [...prev, ...next]);
    setHasMore(next.length === PAGE_SIZE);
  }, [hasMore, places.length]);

  const toggle = useCallback((id: string): void => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const keyExtractor = useCallback((item: Place) => item.id, []);

  const renderItem = useCallback(
    ({ item }: { item: Place }) => {
      const isChecked = selected.has(item.id);
      const catColor =
        CATEGORY_COLORS[item.category as PlaceCategory] || CATEGORY_COLORS.Other;
      return (
        <Pressable
          onPress={() => toggle(item.id)}
          accessibilityRole="checkbox"
          accessibilityLabel={item.name}
          accessibilityState={{ checked: isChecked }}
          style={[styles.row, { borderBottomColor: colors.border }]}
        >
          <View
            style={[
              styles.checkbox,
              {
                borderColor: isChecked ? colors.accent : colors.onSurfaceMuted,
                backgroundColor: isChecked ? colors.accent : "transparent",
              },
            ]}
          >
            {isChecked ? (
              <Ionicons name="checkmark" size={16} color={colors.background} />
            ) : null}
          </View>
          <View style={styles.rowInfo}>
            <Text style={[styles.rowName, { color: colors.onSurface }]} numberOfLines={1}>
              {item.name}
            </Text>
            {item.location ? (
              <Text style={[styles.rowLoc, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
                {item.location}
              </Text>
            ) : null}
          </View>
          <View style={[styles.catDot, { backgroundColor: catColor }]} />
        </Pressable>
      );
    },
    [selected, toggle, colors]
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            hitSlop={12}
          >
            <Text style={[styles.cancelText, { color: colors.onSurfaceVariant }]}>Cancel</Text>
          </Pressable>
          <Text style={[styles.topTitle, { color: colors.onSurface }]}>
            {selected.size} selected
          </Text>
          <Pressable
            onPress={() => onConfirm(Array.from(selected))}
            accessibilityRole="button"
            accessibilityLabel="Done"
            hitSlop={12}
          >
            <Text style={[styles.doneText, { color: colors.accent }]}>Done</Text>
          </Pressable>
        </View>

        {places.length === 0 ? (
          <EmptyState
            icon="location-outline"
            title="No places yet"
            subtitle="Save some places first, then add them to a trip."
          />
        ) : (
          <FlatList
            data={places}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            onEndReached={hasMore ? loadMore : undefined}
            onEndReachedThreshold={0.5}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews
            maxToRenderPerBatch={15}
            windowSize={10}
            initialNumToRender={15}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  cancelText: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  topTitle: {
    fontSize: 16,
    fontFamily: "Manrope_600SemiBold",
  },
  doneText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: ROUNDNESS.sm,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  rowInfo: {
    flex: 1,
  },
  rowName: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  rowLoc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  catDot: {
    width: 10,
    height: 10,
    borderRadius: ROUNDNESS.full,
  },
});
