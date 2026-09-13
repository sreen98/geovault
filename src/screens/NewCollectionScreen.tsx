import React from "react";
import { router } from "expo-router";
import { CollectionForm } from "../components/CollectionForm";
import { useCollectionsStore } from "../stores/collections.store";
import { NewCollection } from "../types/collection.types";

export function NewCollectionScreen() {
  const createCollection = useCollectionsStore((s) => s.createCollection);

  const handleSave = (collection: NewCollection): void => {
    const created = createCollection(collection);
    // Replace rather than push so Back from the new collection returns to the
    // list instead of the form the user just submitted.
    router.replace(`/collection/${created.id}`);
  };

  return <CollectionForm onSave={handleSave} onCancel={() => router.back()} />;
}
