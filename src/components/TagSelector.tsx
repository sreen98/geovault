import { useState } from "react";
import { View, Text, Pressable, TextInput, ScrollView, StyleSheet } from "react-native";
import { STATUS_TAGS } from "../constants/tags";
import { TagsRepository } from "../db/tags.repository";
import { ROUNDNESS, SPACING } from "../constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";

interface TagSelectorProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
}

export function TagSelector({ selectedTags, onChange }: TagSelectorProps) {
  const { colors } = useTheme();
  const [newTagText, setNewTagText] = useState("");
  const customTags = TagsRepository.getAll();
  const allTags: readonly string[] = [...STATUS_TAGS, ...customTags.map((t) => t.label)];

  const toggleTag = (tag: string): void => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter((t) => t !== tag));
    } else {
      onChange([...selectedTags, tag]);
    }
  };

  const addCustomTag = (): void => {
    const label = newTagText.trim();
    if (!label) return;
    if (!TagsRepository.exists(label)) {
      TagsRepository.create(label);
    }
    if (!selectedTags.includes(label)) {
      onChange([...selectedTags, label]);
    }
    setNewTagText("");
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>Tags</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {allTags.map((tag) => {
          const isSelected = selectedTags.includes(tag);
          return (
            <Pressable
              key={tag}
              onPress={() => toggleTag(tag)}
              accessibilityRole="button"
              accessibilityLabel={`Tag: ${tag}`}
              accessibilityState={{ selected: isSelected }}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected ? colors.primary : colors.surfaceContainer,
                  borderColor: isSelected ? colors.primary : colors.surfaceContainer,
                },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: isSelected ? colors.white : colors.onSurface },
                ]}
              >
                {tag}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.surfaceContainerLow,
              color: colors.onSurface,
            },
          ]}
          placeholder="Add custom tag..."
          placeholderTextColor={colors.secondary}
          value={newTagText}
          onChangeText={setNewTagText}
          onSubmitEditing={addCustomTag}
          returnKeyType="done"
          accessibilityLabel="Enter custom tag name"
        />
        {newTagText.trim() ? (
          <Pressable
            onPress={addCustomTag}
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            accessibilityRole="button"
            accessibilityLabel={`Add tag: ${newTagText.trim()}`}
          >
            <Ionicons name="add" size={20} color={colors.white} />
          </Pressable>
        ) : null}
      </View>
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
    paddingBottom: SPACING.sm,
    paddingRight: SPACING.md,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: ROUNDNESS.full,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: SPACING.xs,
  },
  input: {
    flex: 1,
    borderRadius: ROUNDNESS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: ROUNDNESS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
