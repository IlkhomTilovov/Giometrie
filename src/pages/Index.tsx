import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, ArrowLeft, Crown, Percent, Sparkles, Star, Tag, type LucideIcon,
  Search, SlidersHorizontal, Sofa, Armchair, Bed, Table2, DoorClosed, UtensilsCrossed, Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/ProductCard';
import { useFeaturedProducts, useCategories, useSections } from '@/hooks/useProducts';
import { useActiveSets } from '@/hooks/useSets';
import { usePromoTiles } from '@/hooks/usePromoTiles';
import { useLanguage } from '@/hooks/useLanguage';
import { useSEO } from '@/hooks/useSEO';
import { EditableText } from '@/components/EditableText';
import { EditableImage } from '@/components/EditableImage';
import { HeroBento } from '@/components/home/HeroBento';
import { PromoCarousel } from '@/components/home/PromoCarousel';
import { useState, useRef, useEffect, useMemo } from 'react';
import { getPageSeo } from '@/lib/pageSeo';
import { PROMO_ICONS } from '@/lib/promoIcons';
import { DiscountBanner, FeatureStrip } from '@/components/home/HomeSections';


const HOME_PROMO_ICONS: Record<string, LucideIcon> = PROMO_ICONS;

// Keyword match on category name/slug — the DB `icon` field isn't populated by any
// admin UI today, so pills resolve a sensible furniture icon instead of relying on it.
const CATEGORY_ICON_RULES: Array<[RegExp, LucideIcon]> = [
  [/divan|sofa|диван/i, Sofa],
  [/kreslo|armchair|кресл/i, Armchair],
  [/krovat|krevat|yotoq|bed|кроват|спальн/i, Bed],
  [/stol|stul|table|стол|стул/i, Table2],
  [/shkaf|komod|cabinet|wardrobe|шкаф|комод/i, DoorClosed],
  [/oshxona|kitchen|кухн/i, UtensilsCrossed],
];

function resolveCategoryIcon(name: string, slug: string): LucideIcon {
  const haystack = `${name} ${slug}`;
  for (const [pattern, Icon] of CATEGORY_ICON_RULES) {
    if (pattern.test(haystack)) return Icon;
  }
  return Package;
}

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setIsVisible(true); obs.disconnect(); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, isVisible };
}

function SetSection({ set, products, language }: {
  set: ReturnType<typeof useActiveSets>['sets'][number];
  products: ReturnType<typeof useActiveSets>['productsBySet'][string];
  language: 'uz' | 'ru';
}) {
  const PAGE_SIZE = 4;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  if (!products.length) return null;

  const title = language === 'uz' ? set.title_uz : set.title_ru;
  const visible = products.slice(0, visibleCount);
  const hasMore = visibleCount < products.length;

  return (
    <div className="w-full">
      <div className="flex items-end justify-between mb-8">
        <h2 className="font-serif text-4xl lg:text-5xl font-bold text-foreground tracking-tight">
          {title}
        </h2>
        <Link
          to={`/catalog?set=${set.id}`}
          className="hidden md:flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {language === 'uz' ? 'Barchasi' : 'Все'}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
        {visible.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
      {hasMore && (
        <div className="mt-8 flex justify-center">
          <Button
            variant="outline"
            className="rounded-full px-8"
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
          >
            {language === 'uz' ? 'Yana' : 'Ещё'}
          </Button>
        </div>
      )}
    </div>
  );
}



export default function Index() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const homeSeo = getPageSeo('home', language);
  useSEO({ title: homeSeo.title, description: homeSeo.description, ogTitle: homeSeo.title, ogDescription: homeSeo.description });

  const sec1 = useInView();
  const sec2 = useInView();
  const sec3 = useInView();

  const shouldLoadBelowFoldData = sec2.isVisible;
  const { products: featuredProducts } = useFeaturedProducts(4, shouldLoadBelowFoldData);
  // Eager (not gated behind shouldLoadBelowFoldData): the mobile category pill
  // row renders above the fold, right under the hero.
  const { categories, loading: categoriesLoading } = useCategories(true);
  const { sections } = useSections(true);
  const { data: dbPromoTiles = [] } = usePromoTiles();
  const { sets, productsBySet, loading: setsLoading } = useActiveSets(true);

  // The standalone "Materiallar" section (LDSP, LMDF, laminate, etc.) is its own
  // dedicated page (/materials), not part of the regular catalog — its categories
  // must never show up in the homepage's category carousel/pills/banners.
  const materialCategoryIds = useMemo(() => {
    const materialsSectionId = sections.find(s => s.show_in_main_nav === false)?.id;
    if (!materialsSectionId) return new Set<string>();
    const ids = new Set<string>();
    const walk = (id: string) => {
      ids.add(id);
      categories.filter(c => c.parent_id === id).forEach(child => walk(child.id));
    };
    categories.filter(c => c.section_id === materialsSectionId).forEach(c => walk(c.id));
    return ids;
  }, [sections, categories]);
  const nonMaterialCategories = useMemo(
    () => categories.filter(c => !materialCategoryIds.has(c.id)),
    [categories, materialCategoryIds]
  );

  // Toifalarda eski hardcoded/fallback rasmlar umuman ko'rsatilmaydi.
  const categoriesLoaded = shouldLoadBelowFoldData && !categoriesLoading;
  const cats = categoriesLoaded ? nonMaterialCategories : [];
  const catsReady = cats.length > 0;
  // Mobile icon-pill row sits above the fold, so it uses the eagerly-fetched
  // list directly instead of waiting for the scroll-gated `categoriesLoaded`.
  const mobileCats = !categoriesLoading ? nonMaterialCategories : [];

  // Toifalar carousel — one-at-a-time autoplay with seamless infinite loop
  const [catPerPage, setCatPerPage] = useState(4);
  const [catIndex, setCatIndex] = useState(0);
  const [catAnimate, setCatAnimate] = useState(true);
  const catTouchStartX = useRef<number | null>(null);
  const [catPaused, setCatPaused] = useState(false);
  const catResumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pauseCatAutoplay = () => {
    setCatPaused(true);
    if (catResumeTimer.current) clearTimeout(catResumeTimer.current);
    catResumeTimer.current = setTimeout(() => setCatPaused(false), 5000);
  };
  useEffect(() => () => { if (catResumeTimer.current) clearTimeout(catResumeTimer.current); }, []);
  useEffect(() => {
    const compute = () => {
      if (typeof window === 'undefined') return;
      if (window.matchMedia('(min-width: 1024px)').matches) setCatPerPage(4);
      else if (window.matchMedia('(min-width: 768px)').matches) setCatPerPage(3);
      else setCatPerPage(2);
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);
  // Reset to 0 if data shrinks
  useEffect(() => { if (catIndex > cats.length) setCatIndex(0); }, [cats.length, catIndex]);
  // Build a looped list: original + clone of first `catPerPage` so we can slide past the end seamlessly
  const catsLooped = cats.length > 0 ? [...cats, ...cats.slice(0, catPerPage)] : cats;
  const catTotalPages = Math.max(1, Math.ceil(cats.length / catPerPage));
  const goCat = (dir: number) => {
    if (cats.length === 0) return;
    setCatAnimate(true);
    setCatIndex((p) => p + dir);
  };
  const onCatTouchStart = (e: React.TouchEvent) => {
    catTouchStartX.current = e.touches[0].clientX;
    pauseCatAutoplay();
  };
  const onCatTouchEnd = (e: React.TouchEvent) => {
    if (catTouchStartX.current === null) return;
    const diff = catTouchStartX.current - e.changedTouches[0].clientX;
    const SWIPE_THRESHOLD = 50;
    if (diff > SWIPE_THRESHOLD) {
      goCat(1);
    } else if (diff < -SWIPE_THRESHOLD) {
      goCat(-1);
    }
    catTouchStartX.current = null;
    pauseCatAutoplay();
  };
  // Autoplay: advance by 1 every 5s
  useEffect(() => {
    if (cats.length <= catPerPage) return;
    if (catPaused) return;
    const t = setInterval(() => {
      setCatAnimate(true);
      setCatIndex((p) => p + 1);
    }, 5000);
    return () => clearInterval(t);
  }, [cats.length, catPerPage, catPaused]);
  // When we cross past the end (into the cloned tail), snap back without animation
  useEffect(() => {
    if (cats.length === 0) return;
    if (catIndex >= cats.length) {
      const t = setTimeout(() => {
        setCatAnimate(false);
        setCatIndex((p) => p - cats.length);
      }, 700); // match transition duration
      return () => clearTimeout(t);
    }
    if (catIndex < 0) {
      const t = setTimeout(() => {
        setCatAnimate(false);
        setCatIndex((p) => p + cats.length);
      }, 700);
      return () => clearTimeout(t);
    }
  }, [catIndex, cats.length]);
  // Re-enable animation on next frame after a snap
  useEffect(() => {
    if (!catAnimate) {
      const r = requestAnimationFrame(() => setCatAnimate(true));
      return () => cancelAnimationFrame(r);
    }
  }, [catAnimate]);


  return (
    <div className="min-h-screen bg-background">
      {/* ============ QIDIRUV PANELI (mobile only) ============ */}
      <div className="md:hidden container mx-auto px-4 pt-4 pb-1">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const q = new FormData(e.currentTarget).get('q');
            navigate(q ? `/catalog?search=${encodeURIComponent(String(q))}` : '/catalog');
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              name="q"
              type="text"
              placeholder={language === 'uz' ? 'Qidirish...' : 'Поиск...'}
              className="w-full h-11 pl-11 pr-4 rounded-full border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
            />
          </div>
          <Link
            to="/catalog"
            aria-label={language === 'uz' ? 'Filtrlar' : 'Фильтры'}
            className="shrink-0 w-11 h-11 rounded-full border border-border bg-card flex items-center justify-center"
          >
            <SlidersHorizontal className="w-4 h-4 text-foreground" />
          </Link>
        </form>
      </div>

      {/* ============ HERO (to'plamlar bento) ============ */}
      <HeroBento sets={sets as any} loading={setsLoading} language={language} />

      {/* ============ TOIFA IKONKALARI (mobile only) ============ */}
      {mobileCats.length > 0 && (
        <div className="md:hidden container mx-auto px-4 pt-5 pb-1">
          <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-1 px-1">
            {mobileCats.slice(0, 8).map((cat) => {
              const name = language === 'uz' ? cat.name_uz : cat.name_ru;
              const Icon = resolveCategoryIcon(name, cat.slug);
              return (
                <Link
                  key={cat.id}
                  to={`/catalog?category=${cat.slug}`}
                  className="shrink-0 w-[72px] flex flex-col items-center gap-1.5"
                >
                  <div className="w-14 h-14 rounded-2xl bg-card border border-border/60 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-foreground" strokeWidth={1.5} />
                  </div>
                  <span className="text-[11px] text-center text-foreground/80 leading-tight line-clamp-2">
                    {name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}


      {/* ============ PROMO TILES (DB-driven karusel) ============ */}
      <div ref={sec1.ref}>
        <PromoCarousel tiles={dbPromoTiles} language={language} />
      </div>


      <section ref={sec2.ref} className="container mx-auto px-4 lg:px-8 mt-16 lg:mt-24">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-serif text-4xl lg:text-5xl font-bold text-foreground tracking-tight">
              {language === 'uz' ? 'Toifalar' : 'Категория'}
              
            </h2>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={() => goCat(-1)}
              disabled={catTotalPages <= 1}
              className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-border hover:border-foreground/40 hover:bg-card transition-colors flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Previous"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => goCat(1)}
              disabled={catTotalPages <= 1}
              className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-border hover:border-foreground/40 hover:bg-card transition-colors flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Next"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!categoriesLoaded ? (
          <div className="-mx-2 lg:-mx-3 py-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6 px-2 lg:px-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[4/5] bg-muted/50 rounded-[2rem] animate-pulse"
              />
            ))}
          </div>
        ) : !catsReady ? null : (
        <div
          className="overflow-x-hidden overflow-y-visible -mx-2 lg:-mx-3 py-2"
          onTouchStart={onCatTouchStart}
          onTouchEnd={onCatTouchEnd}
        >
          <div
            className="flex"
            style={{
              transform: `translate3d(-${(catIndex * 100) / catPerPage}%, 0, 0)`,
              transition: catAnimate ? 'transform 700ms cubic-bezier(0.22,1,0.36,1)' : 'none',
            }}
          >
            {catsLooped.map((cat: any, i) => {
              const name = language === 'uz' ? cat.name_uz : cat.name_ru;
              const img = cat.image;
              const FallbackIcon = cat.icon;
              return (
                <div
                  key={(cat.slug || cat.id) + '-' + i}
                  className="shrink-0 px-2 lg:px-3"
                  style={{ width: `${100 / catPerPage}%` }}
                >
                  <Link
                    to={`/catalog?category=${cat.slug}`}
                    className="group relative block aspect-[4/5] bg-card rounded-[2rem] overflow-hidden shadow-soft hover:shadow-soft-lg transition-all duration-500 ease-luxe hover:-translate-y-1"
                  >
                    <div className="absolute top-6 left-0 right-0 z-10 text-center">
                      <h3 className="font-sans font-medium text-base lg:text-lg text-media-foreground px-4 drop-shadow-md">
                        {name}
                      </h3>
                    </div>
                    <div className="absolute inset-0">
                      {img ? (
                        <img
                          src={img}
                          alt={name}
                          loading="lazy"
                          decoding="async"
                          width={400}
                          height={500}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-luxe"
                        />
                      ) : FallbackIcon ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <FallbackIcon className="w-32 h-32 text-primary/70 group-hover:scale-110 transition-transform duration-500" strokeWidth={1.2} />
                        </div>
                      ) : null}
                    </div>
                    <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/60 to-transparent z-[5]" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
        )}

        {cats.length > catPerPage && (
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: catTotalPages }).map((_, i) => {
              const currentPage = Math.floor((((catIndex % cats.length) + cats.length) % cats.length) / catPerPage);
              const active = currentPage === i;
              return (
                <button
                  key={i}
                  onClick={() => { setCatAnimate(true); setCatIndex(i * catPerPage); }}
                  aria-label={`Page ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    active ? 'w-8 bg-foreground' : 'w-1.5 bg-foreground/30 hover:bg-foreground/50'
                  }`}
                />
              );
            })}
          </div>
        )}

      </section>

      {/* ============ CHEGIRMA BANNERI ============ */}
      <DiscountBanner products={featuredProducts as any} language={language} />



      {/* ============ SETLAR TO'PLAMI (DB-driven sets, static grid per set) ============ */}
      {setsLoading ? (
        <section ref={sec3.ref} className="container mx-auto px-4 lg:px-8 mt-16 lg:mt-24">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="aspect-square rounded-2xl bg-card animate-pulse" />
            ))}
          </div>
        </section>
      ) : (
        sets.map((s, i) => (
          <section
            key={s.id}
            ref={i === 0 ? sec3.ref : undefined}
            className="container mx-auto px-4 lg:px-8 mt-16 lg:mt-24"
          >
            <SetSection set={s} products={productsBySet[s.id] || []} language={language} />
          </section>
        ))
      )}




      {/* ============ FEATURED PRODUCTS GRID (only if we have more) ============ */}
      {featuredProducts.length > 2 && (
        <section className="container mx-auto px-4 lg:px-8 mt-16 lg:mt-24 pb-16 lg:pb-24">
          <div className="flex items-end justify-between mb-8">
            <h2 className="font-serif text-4xl lg:text-5xl font-bold text-foreground tracking-tight">
              {language === 'uz' ? 'Tanlangan' : 'Избранное'}
            </h2>
            <Button asChild variant="ghost" className="rounded-full text-sm gap-2">
              <Link to="/catalog">
                {language === 'uz' ? "Hammasi" : 'Все'} <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {featuredProducts.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} variant="grid" />
            ))}
          </div>
        </section>
      )}

      {/* ============ ISHONCH BELGILARI (yetkazib berish/qaytarish/kafolat/qo'llab-quvvatlash) ============ */}
      <FeatureStrip language={language} />

    </div>
  );
}
