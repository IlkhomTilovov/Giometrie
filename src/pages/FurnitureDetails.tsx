import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Tag, Boxes } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageLightbox } from '@/components/ImageLightbox';
import { ProductCard } from '@/components/ProductCard';
import { FurnitureCard } from '@/components/FurnitureCard';
import { useLanguage } from '@/hooks/useLanguage';
import { useSEO } from '@/hooks/useSEO';
import { usePublicFurniture } from '@/hooks/useFurniture';
import { getAttributeIcon } from '@/lib/attributeIcons';

export default function FurnitureDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const { item, loading, notFound } = usePublicFurniture(slug || '');
  const [selectedImage, setSelectedImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const name = item ? (language === 'ru' ? item.name_ru : item.name_uz) : '';
  const categoryName = item?.category ? (language === 'ru' ? item.category.name_ru : item.category.name_uz) : null;
  const shortDescription = item ? (language === 'ru' ? item.description_ru : item.description_uz) : null;
  const fullDescription = item ? (language === 'ru' ? item.full_description_ru : item.full_description_uz) : null;
  const metaTitle = item ? (language === 'ru' ? item.meta_title_ru : item.meta_title_uz) : null;
  const metaDescription = item ? (language === 'ru' ? item.meta_description_ru : item.meta_description_uz) : null;

  const installationType = item ? (language === 'ru' ? item.installation_type_ru : item.installation_type_uz) : null;
  const usageInstructions = item ? (language === 'ru' ? item.usage_instructions_ru : item.usage_instructions_uz) : null;
  const installationNotes = item ? (language === 'ru' ? item.installation_notes_ru : item.installation_notes_uz) : null;
  const hasInstallationInfo = !!(installationType || usageInstructions || installationNotes);

  const gallery = item ? [item.image, ...item.images].filter(Boolean) as string[] : [];
  const mainImage = gallery[selectedImage] || gallery[0] || '/placeholder.svg';

  useSEO({
    title: metaTitle || (name ? `${name} | Giometrie` : undefined),
    description: metaDescription || shortDescription || undefined,
    keywords: item?.meta_keywords || undefined,
    ogImage: item?.image || undefined,
    noindex: !item,
  });

  if (loading) {
    return (
      <div id="hero" className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !item) {
    return (
      <div id="hero" className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">
            {language === 'uz' ? 'Furnitura topilmadi' : 'Фурнитура не найдена'}
          </h1>
          <Button asChild>
            <Link to="/catalog">{language === 'uz' ? 'Katalogga qaytish' : 'Вернуться в каталог'}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div id="hero" className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <Button variant="ghost" className="mb-6 gap-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" /> {t.common.back}
        </Button>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          <div>
            <div
              className="aspect-square rounded-2xl overflow-hidden bg-muted mb-4 cursor-zoom-in"
              onClick={() => gallery.length > 0 && setLightboxOpen(true)}
            >
              <img
                src={mainImage}
                alt={name}
                width={800}
                height={800}
                loading="eager"
                decoding="async"
                className="w-full h-full object-contain bg-card"
                onError={(e) => (e.currentTarget.src = '/placeholder.svg')}
              />
            </div>
            {gallery.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {gallery.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === idx ? 'border-primary' : 'border-transparent hover:border-border'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${name} ${idx + 1}`}
                      width={150}
                      height={150}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                      onError={(e) => (e.currentTarget.src = '/placeholder.svg')}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            {categoryName && (
              <span className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-2">
                <Tag className="w-3.5 h-3.5" />
                {categoryName}
              </span>
            )}
            <h1 className="text-3xl font-bold mb-4">{name}</h1>

            <div className="grid sm:grid-cols-2 gap-2 mb-4">
              {item.brand && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <span className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Tag className="w-4 h-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground truncate">
                      {language === 'uz' ? 'Brend' : 'Бренд'}
                    </p>
                    <p className="text-sm font-medium truncate">{item.brand}</p>
                  </div>
                </div>
              )}
              {(item.model || item.article) && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <span className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Boxes className="w-4 h-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground truncate">
                      {language === 'uz' ? 'Model / Artikul' : 'Модель / Артикул'}
                    </p>
                    <p className="text-sm font-medium truncate">
                      {[item.model, item.article].filter(Boolean).join(' / ')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {shortDescription && (
              <p className="text-muted-foreground leading-relaxed">{shortDescription}</p>
            )}

            {/* Texnik xususiyatlar */}
            {item.specifications.length > 0 && (
              <div className="mt-8">
                <h4 className="font-medium mb-3">{language === 'uz' ? 'Texnik xususiyatlar' : 'Технические характеристики'}</h4>
                <div className="grid sm:grid-cols-2 gap-2">
                  {item.specifications.map((spec, idx) => {
                    const Icon = getAttributeIcon(spec.icon);
                    const label = (language === 'uz' ? spec.label_uz : spec.label_ru) || spec.label_uz || spec.label_ru;
                    const val = (language === 'uz' ? spec.value_uz : spec.value_ru) || spec.value_uz || spec.value_ru;
                    if (!label && !val) return null;
                    return (
                      <div key={spec.id || idx} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <span className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground truncate">{label}</p>
                          <p className="text-sm font-medium truncate">{val}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Qo'llanilishi */}
            {item.applicationCategories.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium mb-3">{language === 'uz' ? "Qo'llanilishi" : 'Применение'}</h4>
                <div className="flex flex-wrap gap-2">
                  {item.applicationCategories.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/catalog?category=${cat.slug}`}
                      className="px-3 py-1 bg-muted rounded-full text-sm hover:bg-muted/70 transition-colors"
                    >
                      {language === 'uz' ? cat.name_uz : cat.name_ru}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* O'rnatish va foydalanish */}
            {hasInstallationInfo && (
              <div className="mt-6">
                <h4 className="font-medium mb-3">{language === 'uz' ? "O'rnatish va foydalanish" : 'Установка и использование'}</h4>
                <div className="p-4 bg-muted/50 rounded-xl space-y-3">
                  {installationType && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        {language === 'uz' ? "O'rnatish turi" : 'Тип установки'}
                      </p>
                      <p className="text-sm">{installationType}</p>
                    </div>
                  )}
                  {usageInstructions && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        {language === 'uz' ? 'Foydalanish usuli' : 'Способ использования'}
                      </p>
                      <p className="text-sm whitespace-pre-line">{usageInstructions}</p>
                    </div>
                  )}
                  {installationNotes && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        {language === 'uz' ? 'Muhim eslatmalar' : 'Важные заметки'}
                      </p>
                      <p className="text-sm whitespace-pre-line">{installationNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Furnitura haqida */}
        {fullDescription && (
          <div className="mt-12">
            <h3 className="font-medium mb-3">{language === 'uz' ? 'Furnitura haqida' : 'О фурнитуре'}</h3>
            <div className="p-6 bg-card rounded-xl text-muted-foreground leading-relaxed whitespace-pre-line">
              {fullDescription}
            </div>
          </div>
        )}

        {/* Ushbu furnitura ishlatiladigan mahsulotlar */}
        {item.products.length > 0 && (
          <div className="mt-16">
            <h2 className="font-serif text-2xl font-bold mb-6">
              {language === 'uz' ? 'Ushbu furnitura ishlatiladigan mahsulotlar' : 'Товары с этой фурнитурой'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {item.products.map((p) => (
                <ProductCard key={p.id} product={{ ...p, price: p.price ?? 0, originalPrice: p.original_price ?? undefined }} />
              ))}
            </div>
          </div>
        )}

        {/* O'xshash furniturlar */}
        {item.relatedFurniture.length > 0 && (
          <div className="mt-16">
            <h2 className="font-serif text-2xl font-bold mb-6">
              {language === 'uz' ? "O'xshash furniturlar" : 'Похожая фурнитура'}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {item.relatedFurniture.map((f) => (
                <FurnitureCard key={f.id} item={f} language={language as 'uz' | 'ru'} />
              ))}
            </div>
          </div>
        )}
      </div>

      <ImageLightbox
        images={gallery}
        initialIndex={selectedImage}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}
