import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCollectionsStore } from "../stores/collections.store";
import { CollectionsRepository } from "../db/collections.repository";
import {
  COLLECTION_NAME_MAX,
  DEFAULT_COLLECTION_COLOR,
  DEFAULT_COLLECTION_ICON,
} from "../constants/collections";
import { ROUNDNESS, SPACING } from "../constants/theme";
import { pluralize } from "../utils/plural";
import { useTheme } from "../contexts/ThemeContext";

interface CollectionPickerDialogProps {
  visible: boolean;
  placeId: string;
  placeName: string;
  onSaved: () => void;
  onCancel: () => void;
}

export function CollectionPickerDialog({
  visible,
  placeId,
  placeName,
  onSaved,
  onCancel,
}: CollectionPickerDialogProps) {
  const { colors } = useTheme();
  const { collections, loadCollections, createCollection } =
    useCollectionsStore();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [newName, setNewName] = useState("");

  // Re-read membership each time the sheet opens: it may have changed from the
  // collection screens since this place was last viewed.
  useEffect(() => {
    if (!visible) return;
    loadCollections();
    setSelectedIds(
      CollectionsRepository.getForPlace(placeId).map((collection) => collection.id)
    );
    setNewName("");
  }, [visible, placeId, loadCollections]);

  const toggle = useCallback((collectionId: string): void => {
    setSelectedIds((current) =>
      current.includes(collectionId)
        ? current.filter((id) => id !== collectionId)
        : [...current, collectionId]
    );
  }, []);

  const handleCreate = useCallback((): void => {
    const name = newName.trim();
    if (!name) return;

    const created = createCollection({
      name,
      description: "",
      color: DEFAULT_COLLECTION_COLOR,
      icon: DEFAULT_COLLECTION_ICON,
      startDate: null,
      endDate: null,
    });

    setSelectedIds((current) => [...current, created.id]);
    setNewName("");
  }, [newName, createCollection]);

  const handleSave = useCallback((): void => {
    CollectionsRepository.setCollectionsForPlace(placeId, selectedIds);
    loadCollections();
    onSaved();
  }, [placeId, selectedIds, loadCollections, onSaved]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View
          style={[styles.sheet, { backgroundColor: colors.surfaceElevated }]}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.onSurface }]}>
              Collections
            </Text>
            <Pressable
              onPress={onCancel}
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={12}
            >
              <Ionicons name="close" size={24} color={colors.onSurfaceVariant} />
            </Pressable>
          </View>

          <Text
            style={[styles.subtitle, { color: colors.onSurfaceVariant }]}
            numberOfLines={2}
          >
            Choose where &ldquo;{placeName}&rdquo; belongs.
          </Text>

          {collections.length > 0 ? (
            <ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {collections.map((collection) => {
                const isSelected = selectedIds.includes(collection.id);
                return (
                  <Pressable
                    key={collection.id}
                    onPress={() => toggle(collection.id)}
                    accessibilityRole="checkbox"
                    accessibilityLabel={collection.name}
                    accessibilityState={{ checked: isSelected }}
                    style={[
                      styles.row,
                      {
                        backgroundColor: colors.surfaceCard,
                        borderColor: isSelected
                          ? collection.color
                          : colors.border,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        {
                          backgroundColor: isSelected
                            ? collection.color
                            : "transparent",
                          borderColor: isSelected
                            ? collection.color
                            : colors.borderLight,
                        },
                      ]}
                    >
                      {isSelected ? (
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      ) : null}
                    </View>

                    <Ionicons
                      name={collection.icon}
                      size={18}
                      color={collection.color}
                    />

                    <View style={styles.rowText}>
                      <Text
                        style={[styles.rowTitle, { color: colors.onSurface }]}
                        numberOfLines={1}
                      >
                        {collection.name}
                      </Text>
                      <Text
                        style={[
                          styles.rowCount,
                          { color: colors.onSurfaceMuted },
                        ]}
                      >
                        {pluralize(collection.placeCount, "place")}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : (
            <View style={styles.emptyBlock}>
              <Text style={[styles.emptyText, { color: colors.onSurfaceMuted }]}>
                No collections yet. Create one below.
              </Text>
            </View>
          )}

          <View style={styles.createRow}>
            <TextInput
              style={[
                styles.createInput,
                {
                  backgroundColor: colors.surfaceCard,
                  color: colors.onSurface,
                  borderColor: colors.border,
                },
              ]}
              placeholder="New collection name..."
              placeholderTextColor={colors.onSurfaceMuted}
              value={newName}
              onChangeText={setNewName}
              maxLength={COLLECTION_NAME_MAX}
              onSubmitEditing={handleCreate}
              returnKeyType="done"
              accessibilityLabel="New collection name"
            />
            {newName.trim() ? (
              <Pressable
                onPress={handleCreate}
                accessibilityRole="button"
                accessibilityLabel={`Create collection ${newName.trim()}`}
                style={[styles.createButton, { backgroundColor: colors.accent }]}
              >
                <Ionicons name="add" size={20} color={colors.background} />
              </Pressable>
            ) : null}
          </View>

          <Pressable
            onPress={handleSave}
            accessibilityRole="button"
            accessibilityLabel="Save collections"
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.saveText, { color: colors.white }]}>Done</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.lg,
  },
  sheet: {
    width: "100%",
    maxHeight: "85%",
    borderRadius: ROUNDNESS.xl,
    padding: SPACING.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 20,
    fontFamily: "Manrope_700Bold",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
    lineHeight: 19,
  },
  list: {
    marginTop: SPACING.md,
  },
  listContent: {
    gap: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    borderRadius: ROUNDNESS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: ROUNDNESS.sm,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  rowCount: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  emptyBlock: {
    paddingVertical: SPACING.lg,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  createRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  createInput: {
    flex: 1,
    borderRadius: ROUNDNESS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  createButton: {
    width: 44,
    height: 44,
    borderRadius: ROUNDNESS.md,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: ROUNDNESS.md,
    marginTop: SPACING.md,
  },
  saveText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
