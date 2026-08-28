/**
 * ConcordVest Properties Data Hooks
 *
 * Provides hooks for fetching and managing properties from Supabase.
 * Falls back to demo data when Supabase is not configured.
 */

import { useState, useEffect, useCallback } from "react";
import {
  supabase,
  isSupabaseConfigured,
  type Property,
  type PropertyInsert,
  type PropertyUpdate,
} from "@/lib/supabase";
import { demoProperties, type PropertyRecord } from "@/lib/properties";
import { deletePropertyImage } from "@/lib/storage";

// Convert PropertyRecord (demo) to Property (database format)
// For new properties, omit the id field to let PostgreSQL generate a UUID
export function propertyRecordToDb(
  record: PropertyRecord,
  isNew: boolean = false
): PropertyInsert {
  const dbRecord: PropertyInsert = {
    title: record.title,
    slug: record.slug,
    category: record.category,
    listing_type: record.listingType,
    property_type: record.propertyType,
    location: record.location,
    area: record.area,
    price: record.price,
    bedrooms: record.bedrooms,
    bathrooms: record.bathrooms,
    land_size: record.landSize,
    building_size: record.buildingSize,
    description: record.description,
    features: record.features,
    amenities: record.amenities,
    documentation: record.documentation,
    availability: record.availability.toLowerCase() as
      | "available"
      | "reserved"
      | "sold",
    images: record.images,
    video: record.video || null,
    coordinates: record.coordinates,
    tags: record.tags,
    is_featured:
      record.tags.includes("curated") || record.tags.includes("featured"),
    is_published: record.availability !== "Sold",
  };

  // Only include id if it's a valid UUID (for updates), not for new records
  // Valid UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  if (
    !isNew &&
    record.id &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      record.id
    )
  ) {
    dbRecord.id = record.id;
  }

  return dbRecord;
}

// Convert Property (database) to PropertyRecord (app format)
export function propertyDbToRecord(property: Property): PropertyRecord {
  return {
    id: property.id,
    title: property.title,
    slug: property.slug,
    category: property.category as PropertyRecord["category"],
    listingType: property.listing_type as PropertyRecord["listingType"],
    propertyType: property.property_type as PropertyRecord["propertyType"],
    location: property.location,
    area: property.area,
    price: property.price,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    landSize: property.land_size,
    buildingSize: property.building_size,
    description: property.description,
    features: property.features,
    amenities: property.amenities,
    documentation: property.documentation,
    availability: (property.availability.charAt(0).toUpperCase() +
      property.availability.slice(1)) as PropertyRecord["availability"],
    images: property.images,
    video: property.video || "",
    coordinates: property.coordinates || { lat: 9.07, lng: 7.43 },
    tags: property.tags,
  };
}

// Hook result type
interface UsePropertiesResult {
  properties: PropertyRecord[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// Fetch all published properties
export function useProperties(filters?: {
  category?: string;
  location?: string;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  availability?: string;
  featured?: boolean;
}): UsePropertiesResult {
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProperties = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    if (!isSupabaseConfigured()) {
      // Use demo data
      let filtered = [...demoProperties];

      if (filters?.category && filters.category !== "All Properties") {
        filtered = filtered.filter(p => p.category === filters.category);
      }
      if (filters?.location) {
        filtered = filtered.filter(p =>
          p.location.toLowerCase().includes(filters.location!.toLowerCase())
        );
      }
      if (filters?.propertyType) {
        filtered = filtered.filter(
          p => p.propertyType === filters.propertyType
        );
      }
      if (filters?.minPrice !== undefined) {
        filtered = filtered.filter(p => p.price >= filters.minPrice!);
      }
      if (filters?.maxPrice !== undefined) {
        filtered = filtered.filter(p => p.price <= filters.maxPrice!);
      }
      if (filters?.bedrooms !== undefined) {
        filtered = filtered.filter(p => p.bedrooms >= filters.bedrooms!);
      }
      if (filters?.availability) {
        filtered = filtered.filter(
          p => p.availability === filters.availability
        );
      }

      setProperties(filtered);
      setIsLoading(false);
      return;
    }

    try {
      let query = supabase
        .from("properties")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (filters?.category && filters.category !== "All Properties") {
        query = query.eq("category", filters.category);
      }
      if (filters?.location) {
        query = query.ilike("location", `%${filters.location}%`);
      }
      if (filters?.propertyType) {
        query = query.eq("property_type", filters.propertyType);
      }
      if (filters?.minPrice !== undefined) {
        query = query.gte("price", filters.minPrice);
      }
      if (filters?.maxPrice !== undefined) {
        query = query.lte("price", filters.maxPrice);
      }
      if (filters?.bedrooms !== undefined) {
        query = query.gte("bedrooms", filters.bedrooms);
      }
      if (filters?.availability) {
        query = query.eq("availability", filters.availability.toLowerCase());
      }
      if (filters?.featured) {
        query = query.eq("is_featured", true);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setProperties((data || []).map(propertyDbToRecord));
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to fetch properties")
      );
      // In production, show error; in dev, fallback to demo data
      if (process.env.NODE_ENV !== "production") {
        setProperties(demoProperties);
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    filters?.category,
    filters?.location,
    filters?.propertyType,
    filters?.minPrice,
    filters?.maxPrice,
    filters?.bedrooms,
    filters?.availability,
    filters?.featured,
  ]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  return { properties, isLoading, error, refetch: fetchProperties };
}

// Fetch a single property by slug
export function useProperty(
  slug: string | undefined
): UsePropertiesResult & { property: PropertyRecord | null } {
  const [property, setProperty] = useState<PropertyRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProperty = useCallback(async () => {
    if (!slug) {
      setProperty(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    if (!isSupabaseConfigured()) {
      const found = demoProperties.find(p => p.slug === slug);
      setProperty(found || null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from("properties")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .single();

      if (fetchError) {
        if (fetchError.code === "PGRST116") {
          setProperty(null);
        } else {
          throw new Error(fetchError.message);
        }
      } else {
        setProperty(propertyDbToRecord(data));
      }
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to fetch property")
      );
      // Fallback to demo data
      const found = demoProperties.find(p => p.slug === slug);
      setProperty(found || null);
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchProperty();
  }, [fetchProperty]);

  return {
    property,
    properties: property ? [property] : [],
    isLoading,
    error,
    refetch: fetchProperty,
  };
}

// Admin: Fetch all properties (including unpublished)
export function useAdminProperties(): UsePropertiesResult & {
  createProperty: (
    property: PropertyInsert
  ) => Promise<{ data: Property | null; error: Error | null }>;
  updateProperty: (
    id: string,
    updates: PropertyUpdate
  ) => Promise<{ error: Error | null }>;
  deleteProperty: (id: string) => Promise<{ error: Error | null }>;
} {
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProperties = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    if (!isSupabaseConfigured()) {
      setProperties(demoProperties);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setProperties((data || []).map(propertyDbToRecord));
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to fetch properties")
      );
      setProperties(demoProperties);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const createProperty = useCallback(
    async (
      property: PropertyInsert | PropertyRecord
    ): Promise<{ data: Property | null; error: Error | null }> => {
      if (!isSupabaseConfigured()) {
        const newProperty = {
          ...propertyRecordToDb(property as unknown as PropertyRecord, true),
          id: `cv-${Date.now()}`,
        } as Property;
        return { data: newProperty, error: null };
      }

      try {
        // Check if property is in camelCase (PropertyRecord format) and convert to snake_case
        // PropertyRecord has 'buildingSize', PropertyInsert has 'building_size'
        // For new properties, omit id to let PostgreSQL generate UUID
        const dbProperty =
          "buildingSize" in property
            ? propertyRecordToDb(property as unknown as PropertyRecord, true)
            : (property as PropertyInsert);

        const { data, error: createError } = await supabase
          .from("properties")
          .insert(dbProperty as never)
          .select()
          .single();

        if (createError) {
          return { data: null, error: new Error(createError.message) };
        }

        await fetchProperties();
        return { data, error: null };
      } catch (err) {
        return {
          data: null,
          error:
            err instanceof Error ? err : new Error("Failed to create property"),
        };
      }
    },
    [fetchProperties]
  );

  const updateProperty = useCallback(
    async (
      id: string,
      updates: PropertyUpdate | PropertyRecord
    ): Promise<{ error: Error | null }> => {
      if (!isSupabaseConfigured()) {
        setProperties(prev =>
          prev.map(p =>
            p.id === id ? ({ ...p, ...updates } as PropertyRecord) : p
          )
        );
        return { error: null };
      }

      try {
        // Check if updates are in camelCase (PropertyRecord format) and convert to snake_case
        let dbUpdates: PropertyUpdate;

        if ("buildingSize" in updates) {
          // Convert from PropertyRecord (camelCase) to database format (snake_case)
          // Must NOT spread original updates - that would include invalid camelCase fields
          const record = updates as unknown as PropertyRecord;
          dbUpdates = {
            title: record.title,
            slug: record.slug,
            category: record.category,
            listing_type: record.listingType,
            property_type: record.propertyType,
            location: record.location,
            area: record.area,
            price: record.price,
            bedrooms: record.bedrooms,
            bathrooms: record.bathrooms,
            land_size: record.landSize,
            building_size: record.buildingSize,
            description: record.description,
            features: record.features,
            amenities: record.amenities,
            documentation: record.documentation,
            availability: record.availability.toLowerCase() as
              | "available"
              | "reserved"
              | "sold",
            images: record.images,
            video: record.video || null,
            coordinates: record.coordinates,
            tags: record.tags,
            is_featured:
              record.tags.includes("curated") ||
              record.tags.includes("featured"),
            is_published: record.availability !== "Sold",
            updated_at: new Date().toISOString(),
          };
        } else {
          // Updates already in database format
          dbUpdates = {
            ...updates,
            updated_at: new Date().toISOString(),
          } as PropertyUpdate;
        }

        const { error: updateError } = await supabase
          .from("properties")
          .update(dbUpdates as never)
          .eq("id", id);

        if (updateError) {
          return { error: new Error(updateError.message) };
        }

        await fetchProperties();
        return { error: null };
      } catch (err) {
        return {
          error:
            err instanceof Error ? err : new Error("Failed to update property"),
        };
      }
    },
    [fetchProperties]
  );

  const deleteProperty = useCallback(
    async (id: string): Promise<{ error: Error | null }> => {
      if (!isSupabaseConfigured()) {
        setProperties(prev => prev.filter(p => p.id !== id));
        return { error: null };
      }

      try {
        // Fetch property images from database first to clean up storage
        const { data } = await supabase
          .from("properties")
          .select("images")
          .eq("id", id)
          .single();
        const propData = data as any;

        // Delete the record from the database
        const { error: deleteError } = await supabase
          .from("properties")
          .delete()
          .eq("id", id);

        if (deleteError) {
          return { error: new Error(deleteError.message) };
        }

        // Clean up storage images in the background if deletion succeeded
        const imageUrls = propData?.images || [];
        if (imageUrls.length > 0) {
          for (const url of imageUrls) {
            if (url) {
              await deletePropertyImage(url).catch(err => {
                console.error(
                  `Failed to clean up storage image on property delete:`,
                  err
                );
              });
            }
          }
        }

        await fetchProperties();
        return { error: null };
      } catch (err) {
        return {
          error:
            err instanceof Error ? err : new Error("Failed to delete property"),
        };
      }
    },
    [fetchProperties]
  );

  return {
    properties,
    isLoading,
    error,
    refetch: fetchProperties,
    createProperty,
    updateProperty,
    deleteProperty,
  };
}
