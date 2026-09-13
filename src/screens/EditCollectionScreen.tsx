import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { CollectionForm } from "../components/CollectionForm";
import { useCollectionsStore } from "../stores/collections.store";
import { CollectionsRepository } from "../db/collections.repository";
import { Collection, NewCollection } from "../types/collection.types";
import { useTheme } from "../contexts/ThemeContext";

export function EditCollectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [collection, setCollection] = useState<Collection | null>(null);
  const updateCollection = useCollectionsStore((s) => s.updateCollection);
  const { colors } = useTheme();

  useFocusEffect(
    useCallback(() => {
      if (id) {
        setCollection(CollectionsRepository.getById(id));
      }
    }, [id])
  );

  const handleSave = (updates: NewCollection): void => {
    if (!collection) return;
    updateCollection(collection.id, updates);
    router.back();
  };

  if (!collection) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text
          style={{
            color: colors.onSurfaceVariant,
            fontFamily: "Inter_400Regular",
          }}
        >
          Collection not found
        </Text>
      </View>
    );
  }

  return (
    <CollectionForm
      title="Edit Collection"
      submitLabel="Update Collection"
      initialValues={collection}
      onSave={handleSave}
      onCancel={() => router.back()}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
