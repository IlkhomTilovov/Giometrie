import { useState, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Check, ChevronRight, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { useCart } from '@/hooks/useCart';
import { LazyImage } from '@/components/LazyImage';
import { getAttributeIcon } from '@/lib/attributeIcons';
import type { Product } from '@/hooks/useProducts';
import { getTranslated } from '@shared/translate';

// Support both database and static data types
interface ProductCardProps {
  product: Product | {
    id: string;
    name_uz: string;
    name_ru: string;
    translations?: Record<string, { name?: string }> | null;
    price: number;
    originalPrice?: number;
    images: string[];
    rating?: number;
    reviewCount?: number;
    slug?: string | null;
    original_price?: number | null;
  };
  eager?: boolean;
  imageAspect?: string;
  imageFit?: 'cover' | 'contain';
  compact?: boolean;
  /** 'grid' renders a compact price + round add-to-cart button row, for dense mobile grids. */
  variant?: 'default' | 'grid';
  /** Materials (LDSP, laminate, etc.) aren't ordered through the cart — no "Buyurtma
   *  berish" / "Batafsil" buttons; the whole card just links to the product page. */
  isMaterial?: boolean;
}

export function ProductCard({ product, eager = false, imageAspect = 'aspect-square', imageFit = 'cover', compact = false, variant = 'default', isMaterial = false }: ProductCardProps) {
  const { language, t } = useLanguage();
  const { addItem, isInCart } = useCart();
  const [imgIndex, setImgIndex] = useState(0);
  const inCart = isInCart(product.id);

  // Loose union type (see ProductCardProps) doesn't declare these extra fields on its
  // second, ad-hoc-object branch — same escape hatch the original code already used for
  // originalPrice/slug below.
  const anyProduct = product as any;

  const name = getTranslated(product.translations, language, 'name', language === 'ru' ? product.name_ru : product.name_uz);
  const formatPrice = (price: number) => price.toLocaleString('uz-UZ');

  const price = product.price || 0;
  const originalPrice = 'originalPrice' in product ? product.originalPrice : product.original_price;
  const images = product.images || [];
  const productUrl = 'slug' in product && product.slug
    ? `/product/${product.slug}`
    : `/product/${product.id}`;

  const hasDiscount = originalPrice && originalPrice > price;
  const discountPct = hasDiscount ? Math.round((1 - price / (originalPrice as number)) * 100) : 0;

  // Dense/compact contexts (home page "Tanlangan mahsulotlar" grid, hero pairs carousel)
  // keep today's tight layout — only the name is added there. The richer
  // description/specs/furniture/"Batafsil ko'rish" block is reserved for the
  // regular catalog + "o'xshash mahsulotlar" grids so those dense rows don't grow taller.
  const showRich = variant !== 'grid' && !compact;

  const shortDescription = showRich
    ? getTranslated(product.translations, language, 'description', (language === 'ru' ? anyProduct.description_ru : anyProduct.description_uz) || '')
    : '';

  const attributes: any[] = showRich && Array.isArray(anyProduct.attributes) ? anyProduct.attributes : [];
  const specBoxes = attributes.length > 0
    ? attributes
        .slice(0, 3)
        .map((a) => ({
          icon: a.icon,
          label: (language === 'ru' ? a.label_ru : a.label_uz) || a.label_uz || a.label_ru,
          value: (language === 'ru' ? a.value_ru : a.value_uz) || a.value_uz || a.value_ru,
        }))
        .filter((b) => b.value)
    : showRich
      ? [
          anyProduct.sizes?.[0] ? { icon: 'ruler', label: language === 'uz' ? "O'lcham" : 'Размер', value: anyProduct.sizes[0] } : null,
          anyProduct.materials?.[0] ? { icon: 'layers', label: language === 'uz' ? 'Material' : 'Материал', value: anyProduct.materials[0] } : null,
        ].filter(Boolean) as { icon: string; label: string; value: string }[]
      : [];

  const handleAddToCart = (e: MouseEvent) => {
    e.preventDefault();
    if (!inCart) {
      const cartProduct = { id: product.id, name_uz: product.name_uz, name_ru: product.name_ru, price, images };
      addItem(cartProduct as any);
    }
  };

  return (
    <article className={`group relative h-full flex flex-col bg-background overflow-hidden border border-border/40 shadow-soft-sm hover:shadow-soft transition-shadow duration-300 ${compact ? 'rounded-xl' : showRich ? 'rounded-3xl' : 'rounded-2xl'}`}>
      <Link to={productUrl} className={`block relative ${imageAspect} overflow-hidden bg-background`}>
        {/* Primary image */}
        <LazyImage
          src={images[imgIndex] || images[0] || '/placeholder.svg'}
          alt={name}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          priority={eager}
          className={`w-full h-full ${imageFit === 'contain' ? 'object-contain' : 'object-cover object-center'} bg-card transition-transform duration-500 ease-out group-hover:scale-105`}
          wrapperClassName="w-full h-full absolute inset-0"
        />

        {/* Discount badge */}
        {hasDiscount && (
          <span className={`absolute left-3 bg-foreground text-background text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-lg shadow-soft-sm ${compact ? 'top-2' : 'top-3'}`}>
            −{discountPct}%
          </span>
        )}

        {/* Image counter + dots — only when there's more than one real image to browse */}
        {showRich && images.length > 1 && (
          <div className="absolute left-3 bottom-3 flex items-center gap-2">
            <span className="bg-background/80 backdrop-blur-sm text-foreground text-[11px] font-medium px-2 py-0.5 rounded-full tabular-nums">
              {imgIndex + 1}/{images.length}
            </span>
            <div className="flex items-center gap-1">
              {images.slice(0, 5).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setImgIndex(i);
                  }}
                  aria-label={`${i + 1}`}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${i === imgIndex ? 'bg-background' : 'bg-background/40'}`}
                />
              ))}
            </div>
          </div>
        )}
      </Link>

      <div className={`flex flex-col flex-1 ${compact ? 'p-1.5 md:p-2' : showRich ? 'p-4 md:p-5' : 'p-3 md:p-5'}`}>
        {/* Name */}
        <Link
          to={productUrl}
          className={`font-medium text-foreground hover:text-primary transition-colors ${
            showRich ? 'text-base md:text-lg font-semibold line-clamp-2' : 'text-xs md:text-sm truncate'
          }`}
        >
          {name}
        </Link>

        {showRich && (
          <>
            {shortDescription && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{shortDescription}</p>
            )}

            {specBoxes.length > 0 && (
              <div className="mt-3 grid grid-cols-1 gap-1.5">
                {specBoxes.map((box, i) => {
                  const Icon = getAttributeIcon(box.icon);
                  return (
                    <div key={i} className="flex items-center gap-2 rounded-xl bg-muted/60 p-2">
                      <span className="w-7 h-7 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Icon className="w-3.5 h-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-muted-foreground truncate leading-tight">{box.label}</p>
                        <p className="text-xs font-semibold truncate leading-tight">{box.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        <div className={`flex flex-col mt-auto ${showRich ? 'pt-3' : compact ? 'pt-0.5' : 'pt-1.5'}`}>
          {variant === 'grid' ? (
            <div className="flex items-end justify-end gap-2">
              {price > 0 && (
                <div className="flex flex-col leading-tight min-w-0 mr-auto">
                  {hasDiscount && (
                    <span className="text-muted-foreground line-through tabular-nums text-[10px]">
                      {formatPrice(originalPrice as number)} {t.products.currency}
                    </span>
                  )}
                  <span className="font-sans font-bold text-foreground tracking-tight tabular-nums text-sm truncate">
                    {formatPrice(price)} {t.products.currency}
                  </span>
                </div>
              )}
              <Button
                type="button"
                size="icon"
                variant={inCart ? 'secondary' : 'default'}
                aria-label={inCart ? (language === 'uz' ? 'Savatda' : 'В корзине') : (language === 'uz' ? "Buyurtma berish" : 'Заказать')}
                className="shrink-0 w-8 h-8 rounded-full shadow-soft-sm"
                onClick={handleAddToCart}
              >
                {inCart ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </Button>
            </div>
          ) : showRich ? (
            isMaterial ? (
              <Link
                to={productUrl}
                className="mt-3 flex items-center justify-between gap-2 border-t border-border/60 pt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <span>{language === 'uz' ? "Batafsil ko'rish" : 'Подробнее'}</span>
                <ChevronRight className="w-5 h-5 shrink-0" />
              </Link>
            ) : (
              <div className="mt-3 flex gap-2 border-t border-border/60 pt-3">
                <Button
                  variant={inCart ? 'secondary' : 'default'}
                  aria-label={inCart ? (language === 'uz' ? 'Savatda' : 'В корзине') : (language === 'uz' ? "Buyurtma berish" : 'Заказать')}
                  className="flex-[3] min-w-0 gap-1.5 rounded-full shadow-soft-sm hover:shadow-soft-md transition-all duration-300 h-11"
                  onClick={handleAddToCart}
                >
                  {inCart ? <Check className="w-4 h-4 shrink-0" /> : <ShoppingCart className="w-4 h-4 shrink-0" />}
                  <span className="truncate">{inCart ? (language === 'uz' ? 'Savatda' : 'В корзине') : (language === 'uz' ? "Buyurtma berish" : 'Заказать')}</span>
                </Button>
                <Button variant="outline" asChild className="flex-[2] min-w-0 gap-1 rounded-full h-11">
                  <Link to={productUrl} className="min-w-0">
                    <span className="truncate">{language === 'uz' ? "Batafsil" : 'Подробнее'}</span>
                    <ChevronRight className="w-4 h-4 shrink-0" />
                  </Link>
                </Button>
              </div>
            )
          ) : (
            <>
              {price > 0 && (
                <div className={`flex flex-col leading-tight ${compact ? 'mt-0.5' : 'mt-1.5'}`}>
                  {hasDiscount && (
                    <span className={`text-muted-foreground line-through tabular-nums ${compact ? 'text-[10px]' : 'text-xs'}`}>
                      {formatPrice(originalPrice as number)} {t.products.currency}
                    </span>
                  )}
                  <span className={`font-sans font-bold text-foreground tracking-tight tabular-nums ${compact ? 'text-xs' : 'text-base md:text-lg'}`}>
                    {formatPrice(price)} {t.products.currency}
                  </span>
                </div>
              )}

              <Button
                variant={inCart ? 'secondary' : 'outline'}
                aria-label={inCart ? (language === 'uz' ? 'Savatda' : 'В корзине') : (language === 'uz' ? "Buyurtma berish" : 'Заказать')}
                className={`mt-auto w-full rounded-full shadow-soft-sm hover:shadow-soft-md transition-all duration-300 ${compact ? 'h-8 text-xs' : 'h-10'}`}
                onClick={handleAddToCart}
              >
                {inCart ? (language === 'uz' ? 'Savatda' : 'В корзине') : (language === 'uz' ? "Buyurtma berish" : 'Заказать')}
              </Button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
