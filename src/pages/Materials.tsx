import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/ProductCard';
import { FurnitureCard } from '@/components/FurnitureCard';
import { useProducts, useCategories, useSections } from '@/hooks/useProducts';
import { usePublicFurnitureList } from '@/hooks/useFurniture';
import { useLanguage } from '@/hooks/useLanguage';
import { useSEO } from '@/hooks/useSEO';
import { getPageSeo } from '@/lib/pageSeo';
import { getTranslated } from '@shared/translate';
import { EditableText } from '@/components/EditableText';

const PAGE_SIZE = 24;
const NO_MATCH_ID = '00000000-0000-0000-0000-000000000000';

export default function Materials() {
  const { language } = useLanguage();
  const [currentPage, setCurrentPage] = useState(1);

  const { categories, loading: categoriesLoading } = useCategories();
  const { sections, loading: sectionsLoading } = useSections();
  const { furniture, loading: furnitureLoading } = usePublicFurnitureList();

  // The one section admins have marked "don't show in the main nav" — it
  // gets its own dedicated page (this one) instead of living inside /catalog.
  const standaloneSection = useMemo(
    () => sections.find((s) => s.show_in_main_nav === false),
    [sections]
  );

  const categoryIds = useMemo(() => {
    if (!standaloneSection) return [];
    const ids = new Set<string>();
    const walk = (id: string) => {
      ids.add(id);
      categories.filter((c) => c.parent_id === id).forEach((child) => walk(child.id));
    };
    categories.filter((c) => c.section_id === standaloneSection.id).forEach((c) => walk(c.id));
    return Array.from(ids);
  }, [standaloneSection, categories]);

  const ready = !sectionsLoading && !categoriesLoading;

  const { products, loading: productsLoading, totalCount, totalPages } = useProducts(
    currentPage,
    ready && standaloneSection
      ? { categoryIds: categoryIds.length > 0 ? categoryIds : [NO_MATCH_ID] }
      : { productIds: [] },
    PAGE_SIZE
  );

  const loading = !ready || productsLoading;

  // Group each list by category — like the homepage's category showcase — instead of
  // one long undifferentiated grid. Furniture groups by its own FurnitureCategory;
  // insertion order follows the already-sorted API responses (sortOrder asc), so no
  // extra sort is needed here.
  const furnitureGroups = useMemo(() => {
    const groups = new Map<string, { name: string; items: typeof furniture }>();
    furniture.forEach((item) => {
      const key = item.category?.id || '__none__';
      const name = item.category
        ? (language === 'ru' ? item.category.name_ru : item.category.name_uz)
        : (language === 'ru' ? 'Другое' : 'Boshqalar');
      if (!groups.has(key)) groups.set(key, { name, items: [] });
      groups.get(key)!.items.push(item);
    });
    return Array.from(groups.values());
  }, [furniture, language]);

  const materialGroups = useMemo(() => {
    const byId = new Map(categories.map((c) => [c.id, c]));
    const groups = new Map<string, { name: string; items: typeof products }>();
    // Iterate in categoryIds order (already sorted server-side) so groups appear in a
    // stable, predictable order instead of "whichever product loaded first".
    categoryIds.forEach((id) => {
      const cat = byId.get(id);
      if (!cat) return;
      const items = products.filter((p) => p.category_id === id);
      if (items.length === 0) return;
      const name = language === 'ru' ? cat.name_ru : cat.name_uz;
      groups.set(id, { name, items });
    });
    const grouped = new Set(categoryIds);
    const leftovers = products.filter((p) => !p.category_id || !grouped.has(p.category_id));
    if (leftovers.length > 0) {
      groups.set('__none__', { name: language === 'ru' ? 'Другое' : 'Boshqalar', items: leftovers });
    }
    return Array.from(groups.values());
  }, [products, categories, categoryIds, language]);

  const sectionName = standaloneSection
    ? getTranslated(
        standaloneSection.translations,
        language,
        'name',
        language === 'ru' ? standaloneSection.name_ru : standaloneSection.name_uz
      )
    : null;

  const pageSeo = getPageSeo('materials', language as 'uz' | 'ru');

  useSEO({
    title: sectionName || pageSeo.title,
    description: pageSeo.description,
    ogTitle: sectionName || pageSeo.title,
    ogDescription: pageSeo.description,
    canonical: '/materials',
  });

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPaginationNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, 'ellipsis', totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, 'ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages);
    }
    return pages;
  };

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 lg:py-12">
      {/* Masthead */}
      <div className="text-center py-6 lg:py-8 mb-10 lg:mb-14">
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground mb-2">
          <Package className="w-3.5 h-3.5" />
          <EditableText
            contentKey="materials_eyebrow"
            fallback="Giometrie"
            as="span"
            section="materials"
            field="eyebrow"
          />
        </span>
        <h1 className="font-serif text-2xl lg:text-4xl font-bold text-foreground">
          <EditableText
            contentKey="materials_title"
            fallback={sectionName ? `${language === 'ru' ? 'Фурнитура и' : 'Furnitura va'} ${sectionName.toLowerCase()}` : pageSeo.title}
            as="span"
            className="font-serif text-2xl lg:text-4xl font-bold"
            section="materials"
            field="title"
          />
        </h1>
        <p className="mt-3 text-sm lg:text-base text-muted-foreground max-w-2xl mx-auto">
          <EditableText
            contentKey="materials_description"
            fallback={pageSeo.description}
            as="span"
            className="text-sm lg:text-base"
            section="materials"
            field="description"
          />
        </p>
      </div>

      {/* Furnitura */}
      <section className="mb-14 lg:mb-20">
        <div className="flex items-baseline justify-between gap-4 border-b-2 border-foreground pb-2 mb-6">
          <h2 className="font-serif text-xl lg:text-2xl font-bold">
            {language === 'ru' ? 'Фурнитура' : 'Furnitura'}
          </h2>
          {!furnitureLoading && (
            <span className="text-xs text-muted-foreground shrink-0">
              {furniture.length} {language === 'ru' ? 'позиций' : 'ta'}
            </span>
          )}
        </div>

        {furnitureLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-lg border overflow-hidden animate-pulse">
                <div className="aspect-square bg-muted" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : furniture.length > 0 ? (
          <div className="space-y-8">
            {furnitureGroups.map((group) => (
              <div key={group.name}>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                  {group.name} <span className="font-normal">({group.items.length})</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {group.items.map((item) => (
                    <FurnitureCard key={item.id} item={item} language={language as 'uz' | 'ru'} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-4">
            {language === 'ru' ? 'Фурнитура скоро появится здесь' : "Furnitura tez orada shu yerda paydo bo'ladi"}
          </p>
        )}
      </section>

      {/* Materiallar */}
      <section>
        <div className="flex items-baseline justify-between gap-4 border-b-2 border-foreground pb-2 mb-6">
          <h2 className="font-serif text-xl lg:text-2xl font-bold">
            {language === 'ru' ? 'Материалы' : 'Materiallar'}
          </h2>
        </div>

        {ready && !standaloneSection ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">
              {language === 'ru' ? 'Материалы скоро появятся здесь' : "Materiallar tez orada shu yerda paydo bo'ladi"}
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {language === 'ru' ? 'Загрузка...' : 'Yuklanmoqda...'}
                </span>
              ) : (
                <>
                  {language === 'ru'
                    ? `Показано ${products.length} из ${totalCount}`
                    : `${totalCount} tadan ${products.length} tasi ko'rsatilmoqda`}
                </>
              )}
            </p>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-card rounded-2xl overflow-hidden shadow-warm animate-pulse">
                    <div className="aspect-[4/3] bg-muted" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="space-y-8">
                  {materialGroups.map((group) => (
                    <div key={group.name}>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                        {group.name} <span className="font-normal">({group.items.length})</span>
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {group.items.map((product) => (
                          <ProductCard key={product.id} product={product} isMaterial />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {getPaginationNumbers().map((page, idx) =>
                      page === 'ellipsis' ? (
                        <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">...</span>
                      ) : (
                        <Button
                          key={page}
                          variant={currentPage === page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </Button>
                      )
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground">
                  {language === 'ru' ? 'Товары не найдены' : 'Mahsulotlar topilmadi'}
                </p>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
