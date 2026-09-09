export interface Trip {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  placeCount?: number;
}

export type NewTrip = Omit<Trip, "id" | "createdAt" | "updatedAt" | "placeCount">;

export interface TripRow {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  place_count?: number;
}

export interface TripPlaceRow {
  trip_id: string;
  place_id: string;
  added_at: string;
}

export interface TripMembership {
  tripId: string;
  placeId: string;
  addedAt: string;
}

export function rowToTrip(row: TripRow): Trip {
  return {
    id: row.id,
    name: row.name,
    description: row.description || "",
    color: row.color || "",
    icon: row.icon || "",
    startDate: row.start_date,
    endDate: row.end_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    placeCount: typeof row.place_count === "number" ? row.place_count : undefined,
  };
}
