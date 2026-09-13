import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface FurnitureCardItem {
  id: string;
  name_uz: string;
  name_ru: string;
  slug: string | null;
  image: string | null;
  brand: string | null;
  model?: string | null;
  article?: string | null;
  category?: { name_uz: string; name_ru: string } | null;
}

interface FurnitureCardProps {
  item: FurnitureCardItem;
  language: 'uz' | 'ru';
  /** Shown as "N dona" when provided (e.g. inside a product's furniture list). Omit for a plain catalog card. */
  quantity?: number;
  /** 'grid' (default): square image card for catalog-style grids. 'row': compact horizontal
   *  list item — image, name, brand/model, quantity, chevron — meant to sit inside a bordered
   *  divide-y list container the parent renders (see ProductDetails.tsx's "Furnituralar" section). */
  variant?: 'grid' | 'row';
}

export function FurnitureCard({ item, language, quantity, variant = 'grid' }: FurnitureCardProps) {
  const name = language === 'uz' ? item.name_uz : item.name_ru;
  const categoryName = item.category ? (language === 'uz' ? item.category.name_uz : item.category.name_ru) : null;
  const CardTag = item.slug ? Link : 'div';
  const cardProps = item.slug ? { to: `/furniture/${item.slug}` } : {};

  if (variant === 'row') {
    const secondary = [item.brand, item.model || item.article].filter(Boolean).join(' • ');
    return (
      <CardTag
        {...(cardProps as any)}
        className="flex items-stretch gap-4 hover:bg-muted/40 transition-colors"
      >
        <img
          src={item.image || '/placeholder.svg'}
          alt={name}
          width={80}
          height={80}
          loading="lazy"
          decoding="async"
          className="w-20 h-20 object-cover shrink-0 bg-card"
          onError={(e) => (e.currentTarget.src = '/placeholder.svg')}
        />
        <div className="min-w-0 flex-1 flex items-center py-3 pr-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{name}</p>
            {secondary && <p className="text-xs text-muted-foreground truncate">{secondary}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0 pl-3">
            {quantity !== undefined && (
              <span className="text-sm text-muted-foreground">
                {quantity} {language === 'uz' ? 'dona' : 'шт.'}
              </span>
            )}
            {item.slug && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          </div>
        </div>
      </CardTag>
    );
  }

  return (
    <CardTag
      {...(cardProps as any)}
      className="rounded-lg border overflow-hidden bg-card block transition-shadow hover:shadow-md"
    >
      <img
        src={item.image || '/placeholder.svg'}
        alt={name}
        width={300}
        height={300}
        loading="lazy"
        decoding="async"
        className="w-full aspect-square object-cover"
        onError={(e) => (e.currentTarget.src = '/placeholder.svg')}
      />
      <div className="p-3">
        <p className="text-sm font-medium truncate">{name}</p>
        {(categoryName || item.brand) && (
          <p className="text-xs text-muted-foreground truncate">
            {[categoryName, item.brand].filter(Boolean).join(' • ')}
          </p>
        )}
        {quantity !== undefined && (
          <p className="text-xs text-muted-foreground mt-1">
            {quantity} {language === 'uz' ? 'dona' : 'шт.'}
          </p>
        )}
      </div>
    </CardTag>
  );
}
