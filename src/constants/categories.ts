import { Ionicons } from "@expo/vector-icons";
import { PlaceCategory } from "../types/place.types";

export const CATEGORIES: PlaceCategory[] = [
  "Dining",
  "Cafe",
  "Tourist Attraction",
  "Stay",
  "Viewpoint",
  "Shopping",
  "Fuel/EV",
  "W.C",
  "Other",
];

export const CATEGORY_ICONS: Record<PlaceCategory, keyof typeof Ionicons.glyphMap> = {
  Dining: "restaurant-outline",
  Cafe: "cafe-outline",
  "Tourist Attraction": "camera-outline",
  Stay: "bed-outline",
  Viewpoint: "eye-outline",
  Shopping: "cart-outline",
  "Fuel/EV": "flash-outline",
  "W.C": "water-outline",
  Other: "ellipsis-horizontal-outline",
};

export interface CategoryField {
  key: string;
  label: string;
  placeholder: string;
  multiline?: boolean;
}

export const CATEGORY_FIELDS: Record<PlaceCategory, CategoryField[]> = {
  Dining: [
    { key: "mustOrder", label: "Must Order", placeholder: "Dishes or drinks worth returning for...", multiline: true },
    { key: "avoid", label: "Avoid", placeholder: "Dishes or times to skip...", multiline: true },
  ],
  Cafe: [
    { key: "mustTry", label: "Must Try", placeholder: "Signature drinks or pastries...", multiline: true },
    { key: "avoid", label: "Avoid", placeholder: "Peak hours to avoid...", multiline: true },
  ],
  "Tourist Attraction": [
    { key: "entryFee", label: "Entry Fee", placeholder: "e.g., Free / 500 INR" },
    { key: "trekTime", label: "Trek Time", placeholder: "e.g., 2 hours one way" },
    { key: "bestSeason", label: "Best Season", placeholder: "e.g., October to March" },
  ],
  Stay: [
    { key: "priceRange", label: "Price Range", placeholder: "e.g., 2000-5000 INR per night" },
    { key: "checkInInfo", label: "Check-in Info", placeholder: "e.g., Check-in 2PM, Check-out 11AM" },
  ],
  Viewpoint: [
    { key: "bestTime", label: "Best Time", placeholder: "e.g., Sunrise or golden hour" },
    { key: "trekDuration", label: "Trek Duration", placeholder: "e.g., 45 min uphill" },
  ],
  Shopping: [
    { key: "whatToBuy", label: "What to Buy", placeholder: "Items worth picking up..." },
    { key: "priceRange", label: "Price Range", placeholder: "e.g., Budget-friendly / Premium" },
  ],
  "Fuel/EV": [
    { key: "fuelTypes", label: "Fuel Types", placeholder: "e.g., Petrol, Diesel, EV charging" },
    { key: "amenities", label: "Amenities", placeholder: "e.g., Restroom, cafe, air pump" },
  ],
  "W.C": [
    { key: "cleanliness", label: "Cleanliness", placeholder: "e.g., Clean, Average, Poor" },
    { key: "access", label: "Access", placeholder: "e.g., Free / Paid / Key required" },
  ],
  Other: [],
};
