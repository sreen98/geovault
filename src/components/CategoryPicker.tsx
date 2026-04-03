import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { CATEGORIES, CATEGORY_ICONS } from "../constants/categories";
import { PlaceCategory } from "../types/place.types";
import { ROUNDNESS, SPACING } from "../constants/theme";
import { useTheme } from "../contexts/ThemeContext";

interface CategoryPickerProps {
  value: PlaceCategory;
  onChange: (category: PlaceCategory) => void;
}

export function CategoryPicker({ value, onChange }: CategoryPickerProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>Category</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {CATEGORIES.map((cat) => {
          const isSelected = value === cat;
          return (
            <Pressable
              key={cat}
              onPress={() => onChange(cat)}
              accessibilityRole="button"
              accessibilityLabel={`Category: ${cat}`}
              accessibilityState={{ selected: isSelected }}
              style={[
                styles.chip,
                { backgroundColor: isSelected ? colors.primary : colors.surfaceContainer },
              ]}
            >
              <Text style={styles.icon}>{CATEGORY_ICONS[cat]}</Text>
              <Text
                style={[
                  styles.chipText,
                  { color: isSelected ? colors.white : colors.onSurface },
                ]}
              >
                {cat}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.sm,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Manrope_600SemiBold',
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scrollContent: {
    gap: 8,
    paddingRight: SPACING.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: ROUNDNESS.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
  },
  icon: {
    fontSize: 14,
  },
  chipText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
});
