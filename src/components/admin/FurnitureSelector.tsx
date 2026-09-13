import { useMemo, useState } from 'react';
import { Plus, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAllFurniture, useFurnitureCategories } from '@/hooks/useFurniture';

export interface FurnitureSelection {
  furniture_id: string;
  quantity: number;
}

interface FurnitureSelectorProps {
  value: FurnitureSelection[];
  onChange: (value: FurnitureSelection[]) => void;
  language: 'uz' | 'ru';
}

const L = {
  uz: {
    title: 'Furnituralar',
    hint: 'Mahsulot uchun ishlatiladigan furnituralarni tanlang.',
    add: 'Furnitura qo‘shish',
    empty: 'Hali furnitura biriktirilmagan.',
    quantity: 'Miqdor',
    pickTitle: 'Furnitura tanlash',
    search: 'Nomi, brend yoki artikul bo‘yicha qidirish...',
    allCategories: 'Barcha kategoriyalar',
    noResults: 'Hech narsa topilmadi',
    cancel: 'Bekor qilish',
    confirm: 'Qo‘shish',
    loading: 'Yuklanmoqda...',
  },
  ru: {
    title: 'Фурнитура',
    hint: 'Выберите фурнитуру, используемую для этого товара.',
    add: 'Добавить фурнитуру',
    empty: 'Фурнитура пока не привязана.',
    quantity: 'Кол-во',
    pickTitle: 'Выбор фурнитуры',
    search: 'Поиск по названию, бренду или артикулу...',
    allCategories: 'Все категории',
    noResults: 'Ничего не найдено',
    cancel: 'Отмена',
    confirm: 'Добавить',
    loading: 'Загрузка...',
  },
};

export function FurnitureSelector({ value, onChange, language }: FurnitureSelectorProps) {
  const t = L[language];
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [pending, setPending] = useState<Set<string>>(new Set());

  const { furniture, loading } = useAllFurniture({ isActive: true });
  const { categories } = useFurnitureCategories();

  const byId = useMemo(() => new Map(furniture.map((f) => [f.id, f])), [furniture]);
  const selectedIds = useMemo(() => new Set(value.map((v) => v.furniture_id)), [value]);

  const name = (f: { name_uz: string; name_ru: string }) => (language === 'ru' ? f.name_ru : f.name_uz);

  const filtered = furniture.filter((f) => {
    if (categoryFilter !== 'all' && f.category_id !== categoryFilter) return false;
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      f.name_uz.toLowerCase().includes(q) ||
      f.name_ru.toLowerCase().includes(q) ||
      (f.brand || '').toLowerCase().includes(q) ||
      (f.article || '').toLowerCase().includes(q)
    );
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
    const additions: FurnitureSelection[] = Array.from(pending)
      .filter((id) => !selectedIds.has(id))
      .map((id) => ({ furniture_id: id, quantity: 1 }));
    onChange([...value, ...additions]);
    setPickerOpen(false);
  };

  const updateQuantity = (id: string, quantity: number) => {
    onChange(value.map((v) => (v.furniture_id === id ? { ...v, quantity: Math.max(1, quantity) } : v)));
  };

  const removeItem = (id: string) => {
    onChange(value.filter((v) => v.furniture_id !== id));
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium">{t.title}</h4>
        <p className="text-sm text-muted-foreground">{t.hint}</p>
      </div>

      <div className="space-y-3">
        {value.map((sel) => {
          const f = byId.get(sel.furniture_id);
          if (!f) return null;
          return (
            <div key={sel.furniture_id} className="flex items-center gap-3 rounded-lg border p-3">
              <img
                src={f.image || '/placeholder.svg'}
                alt={name(f)}
                width={48}
                height={48}
                loading="lazy"
                decoding="async"
                className="h-12 w-12 shrink-0 rounded-md border object-cover"
                onError={(e) => (e.currentTarget.src = '/placeholder.svg')}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{name(f)}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {[f.category ? name(f.category) : null, f.brand].filter(Boolean).join(' • ') || '—'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{t.quantity}:</span>
                <Input
                  type="number"
                  min={1}
                  value={sel.quantity}
                  onChange={(e) => updateQuantity(sel.furniture_id, parseInt(e.target.value, 10) || 1)}
                  className="h-8 w-16"
                />
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(sel.furniture_id)}>
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
                    {name(c)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 overflow-y-auto rounded-md border">
            {loading ? (
              <p className="p-4 text-sm text-muted-foreground">{t.loading}</p>
            ) : filtered.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">{t.noResults}</p>
            ) : (
              filtered.map((f) => {
                const alreadySelected = selectedIds.has(f.id);
                const checked = alreadySelected || pending.has(f.id);
                return (
                  <label
                    key={f.id}
                    className={`flex cursor-pointer items-center gap-3 border-b p-3 last:border-b-0 hover:bg-accent ${alreadySelected ? 'opacity-50' : ''}`}
                  >
                    <Checkbox
                      checked={checked}
                      disabled={alreadySelected}
                      onCheckedChange={() => togglePending(f.id)}
                    />
                    <img
                      src={f.image || '/placeholder.svg'}
                      alt={name(f)}
                      width={40}
                      height={40}
                      loading="lazy"
                      decoding="async"
                      className="h-10 w-10 shrink-0 rounded-md border object-cover"
                      onError={(e) => (e.currentTarget.src = '/placeholder.svg')}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{name(f)}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {[f.category ? name(f.category) : null, f.brand, f.model || f.article]
                          .filter(Boolean)
                          .join(' • ') || '—'}
                      </p>
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
