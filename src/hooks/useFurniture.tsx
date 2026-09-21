import { useEffect, useState } from 'react';
import { apiGet } from '@/integrations/api/client';
import type { ProductAttribute } from '@/components/admin/AttributesEditor';

export interface FurnitureCategory {
  id: string;
  name_uz: string;
  name_ru: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
}

export interface ApplicationCategory {
  id: string;
  name_uz: string;
  name_ru: string;
  slug: string;
}

export interface FurnitureRelatedProduct {
  id: string;
  name_uz: string;
  name_ru: string;
  slug: string | null;
  images: string[];
  price: number | null;
  original_price: number | null;
  quantity: number;
}

export interface Furniture {
  id: string;
  name_uz: string;
  name_ru: string;
  translations: Record<string, { name?: string }> | null;
  slug: string;
  category_id: string | null;
  category: FurnitureCategory | null;
  brand: string | null;
  model: string | null;
  article: string | null;
  image: string | null;
  images: string[];
  description_uz: string | null;
  description_ru: string | null;
  full_description_uz: string | null;
  full_description_ru: string | null;
  specifications: ProductAttribute[];
  application_category_ids: string[];
  installation_type_uz: string | null;
  installation_type_ru: string | null;
  usage_instructions_uz: string | null;
  usage_instructions_ru: string | null;
  installation_notes_uz: string | null;
  installation_notes_ru: string | null;
  meta_title_uz: string | null;
  meta_title_ru: string | null;
  meta_description_uz: string | null;
  meta_description_ru: string | null;
  meta_keywords: string | null;
  is_active: boolean;
  sort_order: number;
  product_count: number;
}

export interface FurniturePublicDetail extends Furniture {
  products: FurnitureRelatedProduct[];
  applicationCategories: ApplicationCategory[];
  relatedFurniture: Furniture[];
}

function mapCategory(c: any): FurnitureCategory {
  return {
    id: c.id,
    name_uz: c.nameUz,
    name_ru: c.nameRu,
    slug: c.slug,
    sort_order: c.sortOrder,
    is_active: c.isActive,
  };
}

function mapFurniture(f: any): Furniture {
  return {
    id: f.id,
    name_uz: f.nameUz,
    name_ru: f.nameRu,
    translations: f.translations,
    slug: f.slug,
    category_id: f.categoryId,
    category: f.category ? mapCategory(f.category) : null,
    brand: f.brand,
    model: f.model,
    article: f.article,
    image: f.image,
    images: f.images || [],
    description_uz: f.descriptionUz,
    description_ru: f.descriptionRu,
    full_description_uz: f.fullDescriptionUz,
    full_description_ru: f.fullDescriptionRu,
    specifications: Array.isArray(f.specifications) ? f.specifications : [],
    application_category_ids: f.applicationCategoryIds || [],
    installation_type_uz: f.installationTypeUz,
    installation_type_ru: f.installationTypeRu,
    usage_instructions_uz: f.usageInstructionsUz,
    usage_instructions_ru: f.usageInstructionsRu,
    installation_notes_uz: f.installationNotesUz,
    installation_notes_ru: f.installationNotesRu,
    meta_title_uz: f.metaTitleUz,
    meta_title_ru: f.metaTitleRu,
    meta_description_uz: f.metaDescriptionUz,
    meta_description_ru: f.metaDescriptionRu,
    meta_keywords: f.metaKeywords,
    is_active: f.isActive,
    sort_order: f.sortOrder,
    product_count: f._count?.productLinks ?? 0,
  };
}

function mapApplicationCategory(c: any): ApplicationCategory {
  return { id: c.id, name_uz: c.nameUz, name_ru: c.nameRu, slug: c.slug };
}

function mapRelatedProduct(p: any): FurnitureRelatedProduct {
  return {
    id: p.id,
    name_uz: p.nameUz,
    name_ru: p.nameRu,
    slug: p.slug,
    images: p.images || [],
    price: p.price,
    original_price: p.originalPrice,
    quantity: p.quantity,
  };
}

// Admin hook: returns all furniture (with usage counts), optionally filtered.
export function useAllFurniture(filters?: { search?: string; categoryId?: string; isActive?: boolean }) {
  const [furniture, setFurniture] = useState<Furniture[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = async () => {
    setLoading(true);
    try {
      const { items } = await apiGet<{ items: any[] }>('/api/furniture/admin', {
        search: filters?.search || undefined,
        categoryId: filters?.categoryId || undefined,
        isActive: filters?.isActive,
      });
      setFurniture(items.map(mapFurniture));
    } catch (e) {
      console.error('useAllFurniture:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters?.search, filters?.categoryId, filters?.isActive]);

  return { furniture, loading, refetch };
}

// Public hook: fetches every active furniture item for the combined public
// catalog page (src/pages/Materials.tsx).
export function usePublicFurnitureList() {
  const [furniture, setFurniture] = useState<Furniture[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        const { items } = await apiGet<{ items: any[] }>('/api/furniture/public');
        setFurniture(items.map(mapFurniture));
      } catch (e) {
        console.error('usePublicFurnitureList:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { furniture, loading };
}

// Public hook: fetches one active furniture item by slug for the public detail page
// (src/pages/FurnitureDetails.tsx), including the products it's used in, the
// categories it applies to, and same-category related furniture — all resolved
// server-side in one request. Returns null (not an error) for an unknown/inactive slug.
export function usePublicFurniture(slug: string) {
  const [item, setItem] = useState<FurniturePublicDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setNotFound(false);
    (async () => {
      try {
        const { item: raw } = await apiGet<{ item: any }>(`/api/furniture/public/${slug}`);
        setItem({
          ...mapFurniture(raw),
          products: (raw.products || []).map(mapRelatedProduct),
          applicationCategories: (raw.applicationCategories || []).map(mapApplicationCategory),
          relatedFurniture: (raw.relatedFurniture || []).map(mapFurniture),
        });
      } catch (e) {
        setNotFound(true);
        setItem(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  return { item, loading, notFound };
}

export function useFurnitureCategories() {
  const [categories, setCategories] = useState<FurnitureCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = async () => {
    setLoading(true);
    try {
      const { items } = await apiGet<{ items: any[] }>('/api/furniture-categories');
      setCategories(items.map(mapCategory));
    } catch (e) {
      console.error('useFurnitureCategories:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, []);

  return { categories, loading, refetch };
}
