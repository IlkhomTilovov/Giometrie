import { useMemo, useState } from 'react';
import { Plus, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAllMaterialProducts } from '@/hooks/useProducts';

export interface MaterialSelection {
  material_id: string;
  quantity: number;
}

interface MaterialSelectorProps {
  value: MaterialSelection[];
  onChange: (value: MaterialSelection[]) => void;
  language: 'uz' | 'ru';
}

const L = {
  uz: {
    title: 'Materiallar',
    hint: "Mahsulot qaysi materiallardan (LDSP, LMDF va h.k.) yasalganini tanlang.",
    add: 'Material qo‘shish',
    empty: 'Hali material biriktirilmagan.',
    quantity: 'Miqdor',
    pickTitle: 'Material tanlash',
    search: 'Nomi bo‘yicha qidirish...',
    allCategories: 'Barcha toifalar',
    noResults: 'Hech narsa topilmadi',
    cancel: 'Bekor qilish',
    confirm: 'Qo‘shish',
    loading: 'Yuklanmoqda...',
    none: 'Hozircha "Materiallar" bo‘limida mahsulot yo‘q.',
  },
  ru: {
    title: 'Материалы',
    hint: 'Выберите, из каких материалов (ЛДСП, ЛМДФ и т.д.) сделан товар.',
    add: 'Добавить материал',
    empty: 'Материалы пока не привязаны.',
    quantity: 'Кол-во',
    pickTitle: 'Выбор материала',
    search: 'Поиск по названию...',
    allCategories: 'Все категории',
    noResults: 'Ничего не найдено',
    cancel: 'Отмена',
    confirm: 'Добавить',
    loading: 'Загрузка...',
    none: 'В разделе "Материалы" пока нет товаров.',
  },
};

export function MaterialSelector({ value, onChange, language }: MaterialSelectorProps) {
  const t = L[language];
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [pending, setPending] = useState<Set<string>>(new Set());

  const { products, categories, loading } = useAllMaterialProducts({
    categoryId: categoryFilter !== 'all' ? categoryFilter : undefined,
  });

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const selectedIds = useMemo(() => new Set(value.map((v) => v.material_id)), [value]);

  const name = (p: { name_uz: string; name_ru: string }) => (language === 'ru' ? p.name_ru : p.name_uz);

  const filtered = products.filter((p) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return p.name_uz.toLowerCase().includes(q) || p.name_ru.toLowerCase().includes(q);
  });

  const openPicker = () => {
    setPending(new Set());
    setSearch('');
    setCategoryFilter('all');
    setPickerOpen(true);
  };

  const togglePending = (id: string) => {
    setPending((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const confirmPicker = () => {
    const additions: MaterialSelection[] = Array.from(pending)
      .filter((id) => !selectedIds.has(id))
      .map((id) => ({ material_id: id, quantity: 1 }));
    onChange([...value, ...additions]);
    setPickerOpen(false);
  };

  const updateQuantity = (id: string, quantity: number) => {
    onChange(value.map((v) => (v.material_id === id ? { ...v, quantity: Math.max(1, quantity) } : v)));
  };

  const removeItem = (id: string) => {
    onChange(value.filter((v) => v.material_id !== id));
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium">{t.title}</h4>
        <p className="text-sm text-muted-foreground">{t.hint}</p>
      </div>

      <div className="space-y-3">
        {value.map((sel) => {
          const p = byId.get(sel.material_id);
          if (!p) return null;
          return (
            <div key={sel.material_id} className="flex items-center gap-3 rounded-lg border p-3">
              <img
                src={p.images?.[0] || '/placeholder.svg'}
                alt={name(p)}
                width={48}
                height={48}
                loading="lazy"
                decoding="async"
                className="h-12 w-12 shrink-0 rounded-md border object-cover"
                onError={(e) => (e.currentTarget.src = '/placeholder.svg')}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{name(p)}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{t.quantity}:</span>
                <Input
                  type="number"
                  min={1}
                  value={sel.quantity}
                  onChange={(e) => updateQuantity(sel.material_id, parseInt(e.target.value, 10) || 1)}
                  className="h-8 w-16"
                />
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(sel.material_id)}>
                <X className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          );
        })}
        {value.length === 0 && <p className="text-sm text-muted-foreground">{t.empty}</p>}
      </div>

      <Button type="button" variant="outline" onClick={openPicker}>
        <Plus className="mr-2 h-4 w-4" />
        {t.add}
      </Button>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{t.pickTitle}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t.search}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="sm:w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allCategories}</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {language === 'ru' ? c.name_ru : c.name_uz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 overflow-y-auto rounded-md border">
            {loading ? (
              <p className="p-4 text-sm text-muted-foreground">{t.loading}</p>
            ) : filtered.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">{products.length === 0 ? t.none : t.noResults}</p>
            ) : (
              filtered.map((p) => {
                const alreadySelected = selectedIds.has(p.id);
                const checked = alreadySelected || pending.has(p.id);
                return (
                  <label
                    key={p.id}
                    className={`flex cursor-pointer items-center gap-3 border-b p-3 last:border-b-0 hover:bg-accent ${alreadySelected ? 'opacity-50' : ''}`}
                  >
                    <Checkbox
                      checked={checked}
                      disabled={alreadySelected}
                      onCheckedChange={() => togglePending(p.id)}
                    />
                    <img
                      src={p.images?.[0] || '/placeholder.svg'}
                      alt={name(p)}
                      width={40}
                      height={40}
                      loading="lazy"
                      decoding="async"
                      className="h-10 w-10 shrink-0 rounded-md border object-cover"
                      onError={(e) => (e.currentTarget.src = '/placeholder.svg')}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{name(p)}</p>
                    </div>
                  </label>
                );
              })
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPickerOpen(false)}>
              {t.cancel}
            </Button>
            <Button onClick={confirmPicker} disabled={pending.size === 0}>
              {t.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
