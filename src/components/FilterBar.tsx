import { View, ScrollView, StyleSheet } from "react-native";
import { STATUS_TAGS } from "../constants/tags";
import { TagChip } from "./TagChip";
import { SPACING } from "../constants/theme";

interface FilterBarProps {
  activeTag: string | null;
  onTagPress: (tag: string | null) => void;
}

export function FilterBar({ activeTag, onTagPress }: FilterBarProps) {
  return (
    <View style={styles.container} accessibilityRole="toolbar" accessibilityLabel="Filter places by status">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <TagChip
          label="All"
          selected={activeTag === null}
          onPress={() => onTagPress(null)}
          size="md"
        />

        {STATUS_TAGS.map((tag) => (
          <TagChip
            key={tag}
            label={tag}
            selected={activeTag === tag}
            onPress={() => onTagPress(activeTag === tag ? null : tag)}
            size="md"
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.sm,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
});
