import { useRef, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Image as ImageIcon,
  Search,
  AlertTriangle,
  Package,
  X,
  Loader2,
} from 'lucide-react';
import { apiPost, apiPatch, apiDelete, apiUpload } from '@/integrations/api/client';
import { convertImageToWebP } from '@/lib/imageToWebp';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import { useCategories } from '@/hooks/useProducts';
import { useAllFurniture, useFurnitureCategories, type Furniture } from '@/hooks/useFurniture';
import { AttributesEditor, ProductAttribute } from '@/components/admin/AttributesEditor';
import { FurnitureGalleryUploader } from '@/components/admin/FurnitureGalleryUploader';

const L = {
  uz: {
    title: 'Furnituralar',
    subtitle: "Mahsulotlarni yig'ish uchun ishlatiladigan furnitura va aksessuarlar katalogi",
    newItem: 'Yangi furnitura',
    searchPlaceholder: 'Nomi, brend yoki artikul bo‘yicha qidirish...',
    allCategories: 'Barcha kategoriyalar',
    active: 'Aktiv',
    inactive: 'Nofaol',
    image: 'Rasm',
    name: 'Nomi',
    category: 'Kategoriya',
    brand: 'Brend',
    model: 'Model / Artikul',
    usedIn: 'Mahsulotlarda',
    status: 'Holati',
    actions: 'Amallar',
    notFound: 'Hech narsa topilmadi',
    editTitle: 'Furniturani tahrirlash',
    newTitle: 'Yangi furnitura',
    tabBasic: 'Asosiy',
    tabDescription: 'Tavsif',
    tabSpecs: 'Xususiyatlar',
    tabImages: 'Rasmlar',
    tabApplication: "Qo'llanilishi",
    tabInstallation: "O'rnatish",
    tabSeo: 'SEO',
    nameUz: 'Nomi (UZ) *',
    nameRu: 'Nomi (RU) *',
    slug: 'Slug (URL)',
    slugAuto: 'avtomatik yaratiladi',
    slugTaken: 'Bu slug allaqachon mavjud',
    pickCategory: 'Kategoriyani tanlang',
    noCategory: '— Kategoriyasiz —',
    addCategory: '+ Yangi kategoriya qo‘shish',
    newCategoryTitle: 'Yangi furnitura kategoriyasi',
    newCategoryNameUz: 'Nomi (UZ)',
    newCategoryNameRu: 'Nomi (RU)',
    brandLabel: 'Brend',
    modelLabel: 'Model',
    articleLabel: 'Artikul',
    shortDescUz: 'Qisqa tavsif (UZ)',
    shortDescUzHint: 'Sahifaning yuqori qismida ko‘rinadi',
    shortDescRu: 'Qisqa tavsif (RU)',
    fullDescUz: 'Batafsil tavsif (UZ)',
    fullDescRu: 'Batafsil tavsif (RU)',
    mainImage: 'Asosiy rasm',
    uploadImage: 'Rasm yuklash',
    gallery: 'Galereya rasmlari',
    addGalleryImage: 'Rasm qo‘shish',
    applicationHint: 'Ushbu furnitura qaysi mahsulot toifalarida qo‘llanilishini belgilang.',
    noCategories: 'Toifalar mavjud emas.',
    installationTypeUz: "O'rnatish turi (UZ)",
    installationTypeRu: "O'rnatish turi (RU)",
    usageInstructionsUz: 'Foydalanish usuli (UZ)',
    usageInstructionsRu: 'Foydalanish usuli (RU)',
    installationNotesUz: 'Muhim eslatmalar (UZ)',
    installationNotesRu: 'Muhim eslatmalar (RU)',
    metaTitleUz: 'SEO sarlavha (UZ)',
    metaTitleRu: 'SEO sarlavha (RU)',
    metaDescUz: 'SEO tavsif (UZ)',
    metaDescRu: 'SEO tavsif (RU)',
    metaKeywords: 'Kalit so‘zlar',
    active_: 'Aktiv',
    cancel: 'Bekor qilish',
    save: 'Saqlash',
    create: 'Yaratish',
    deleteTitle: "Furniturani o'chirish",
    confirmDelete: (name: string) => `"${name}" furniturasini o'chirmoqchimisiz?`,
    usedInProducts: (name: string, count: number) =>
      `"${name}" hozirda ${count} ta mahsulotga biriktirilgan. Baribir o'chirilsa, bu mahsulotlardan ham avtomatik olib tashlanadi. Davom ettirilsinmi?`,
    delete: "O'chirish",
    success: 'Muvaffaqiyat',
    error: 'Xatolik',
    created: 'Furnitura yaratildi',
    updated: 'Furnitura yangilandi',
    deleted: "Furnitura o'chirildi",
    requiredFields: 'Nomini kiriting',
    imageTypeError: 'Faqat JPEG, PNG, WEBP yoki GIF fayllar qabul qilinadi',
    imageSizeError: "Rasm hajmi 5MB dan oshmasligi kerak",
  },
  ru: {
    title: 'Фурнитура',
    subtitle: 'Каталог фурнитуры и комплектующих, используемых при сборке товаров',
    newItem: 'Новая фурнитура',
    searchPlaceholder: 'Поиск по названию, бренду или артикулу...',
    allCategories: 'Все категории',
    active: 'Активна',
    inactive: 'Неактивна',
    image: 'Фото',
    name: 'Название',
    category: 'Категория',
    brand: 'Бренд',
    model: 'Модель / Артикул',
    usedIn: 'В товарах',
    status: 'Статус',
    actions: 'Действия',
    notFound: 'Ничего не найдено',
    editTitle: 'Редактировать фурнитуру',
    newTitle: 'Новая фурнитура',
    tabBasic: 'Основное',
    tabDescription: 'Описание',
    tabSpecs: 'Характеристики',
    tabImages: 'Изображения',
    tabApplication: 'Применение',
    tabInstallation: 'Установка',
    tabSeo: 'SEO',
    nameUz: 'Название (UZ) *',
    nameRu: 'Название (RU) *',
    slug: 'Slug (URL)',
    slugAuto: 'создаётся автоматически',
    slugTaken: 'Этот slug уже занят',
    pickCategory: 'Выберите категорию',
    noCategory: '— Без категории —',
    addCategory: '+ Добавить новую категорию',
    newCategoryTitle: 'Новая категория фурнитуры',
    newCategoryNameUz: 'Название (UZ)',
    newCategoryNameRu: 'Название (RU)',
    brandLabel: 'Бренд',
    modelLabel: 'Модель',
    articleLabel: 'Артикул',
    shortDescUz: 'Краткое описание (UZ)',
    shortDescUzHint: 'Отображается в верхней части страницы',
    shortDescRu: 'Краткое описание (RU)',
    fullDescUz: 'Подробное описание (UZ)',
    fullDescRu: 'Подробное описание (RU)',
    mainImage: 'Основное изображение',
    uploadImage: 'Загрузить фото',
    gallery: 'Изображения галереи',
    addGalleryImage: 'Добавить фото',
    applicationHint: 'Укажите, в каких категориях товаров применяется эта фурнитура.',
    noCategories: 'Категорий нет.',
    installationTypeUz: 'Тип установки (UZ)',
    installationTypeRu: 'Тип установки (RU)',
    usageInstructionsUz: 'Способ использования (UZ)',
    usageInstructionsRu: 'Способ использования (RU)',
    installationNotesUz: 'Важные заметки (UZ)',
    installationNotesRu: 'Важные заметки (RU)',
    metaTitleUz: 'SEO заголовок (UZ)',
    metaTitleRu: 'SEO заголовок (RU)',
    metaDescUz: 'SEO описание (UZ)',
    metaDescRu: 'SEO описание (RU)',
    metaKeywords: 'Ключевые слова',
    active_: 'Активна',
    cancel: 'Отмена',
    save: 'Сохранить',
    create: 'Создать',
    deleteTitle: 'Удалить фурнитуру',
    confirmDelete: (name: string) => `Удалить фурнитуру «${name}»?`,
    usedInProducts: (name: string, count: number) =>
      `«${name}» сейчас привязана к ${count} товар(ам). При удалении она будет автоматически убрана из них. Продолжить?`,
    delete: 'Удалить',
    success: 'Успешно',
    error: 'Ошибка',
    created: 'Фурнитура создана',
    updated: 'Фурнитура обновлена',
    deleted: 'Фурнитура удалена',
    requiredFields: 'Введите название',
    imageTypeError: 'Принимаются только файлы JPEG, PNG, WEBP или GIF',
    imageSizeError: 'Размер изображения не должен превышать 5МБ',
  },
};

interface FormData {
  name_uz: string;
  name_ru: string;
  slug: string;
  category_id: string;
  brand: string;
  model: string;
  article: string;
  image: string;
  images: string[];
  description_uz: string;
  description_ru: string;
  full_description_uz: string;
  full_description_ru: string;
  specifications: ProductAttribute[];
  application_category_ids: string[];
  installation_type_uz: string;
  installation_type_ru: string;
  usage_instructions_uz: string;
  usage_instructions_ru: string;
  installation_notes_uz: string;
  installation_notes_ru: string;
  meta_title_uz: string;
  meta_title_ru: string;
  meta_description_uz: string;
  meta_description_ru: string;
  meta_keywords: string;
  is_active: boolean;
}

const emptyForm: FormData = {
  name_uz: '',
  name_ru: '',
  slug: '',
  category_id: '',
  brand: '',
  model: '',
  article: '',
  image: '',
  images: [],
  description_uz: '',
  description_ru: '',
  full_description_uz: '',
  full_description_ru: '',
  specifications: [],
  application_category_ids: [],
  installation_type_uz: '',
  installation_type_ru: '',
  usage_instructions_uz: '',
  usage_instructions_ru: '',
  installation_notes_uz: '',
  installation_notes_ru: '',
  meta_title_uz: '',
  meta_title_ru: '',
  meta_description_uz: '',
  meta_description_ru: '',
  meta_keywords: '',
  is_active: true,
};

const TRANSLIT_MAP: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh',
  з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
  п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'x', ц: 'ts',
  ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu',
  я: 'ya', ў: 'o', қ: 'q', ғ: 'g', ҳ: 'h',
};

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .split('')
    .map((char) => TRANSLIT_MAP[char] || char)
    .join('')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export default function FurnitureAdmin() {
  const { language } = useLanguage();
  const t = L[language === 'ru' ? 'ru' : 'uz'];
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const { furniture, loading, refetch } = useAllFurniture({
    search: searchQuery || undefined,
    categoryId: categoryFilter !== 'all' ? categoryFilter : undefined,
  });
  const { categories: furnitureCategories, refetch: refetchCategories } = useFurnitureCategories();
  const { categories: productCategories } = useCategories();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Furniture | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [activeTab, setActiveTab] = useState('basic');
  const [slugError, setSlugError] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [newCategoryOpen, setNewCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState({ uz: '', ru: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categoryName = (c: { name_uz: string; name_ru: string }) => (language === 'ru' ? c.name_ru : c.name_uz);

  const openCreateDialog = () => {
    setSelected(null);
    setFormData(emptyForm);
    setSlugError('');
    setActiveTab('basic');
    setDialogOpen(true);
  };

  const openEditDialog = (item: Furniture) => {
    setSelected(item);
    setFormData({
      name_uz: item.name_uz,
      name_ru: item.name_ru,
      slug: item.slug,
      category_id: item.category_id || '',
      brand: item.brand || '',
      model: item.model || '',
      article: item.article || '',
      image: item.image || '',
      images: item.images || [],
      description_uz: item.description_uz || '',
      description_ru: item.description_ru || '',
      full_description_uz: item.full_description_uz || '',
      full_description_ru: item.full_description_ru || '',
      specifications: item.specifications || [],
      application_category_ids: item.application_category_ids || [],
      installation_type_uz: item.installation_type_uz || '',
      installation_type_ru: item.installation_type_ru || '',
      usage_instructions_uz: item.usage_instructions_uz || '',
      usage_instructions_ru: item.usage_instructions_ru || '',
      installation_notes_uz: item.installation_notes_uz || '',
      installation_notes_ru: item.installation_notes_ru || '',
      meta_title_uz: item.meta_title_uz || '',
      meta_title_ru: item.meta_title_ru || '',
      meta_description_uz: item.meta_description_uz || '',
      meta_description_ru: item.meta_description_ru || '',
      meta_keywords: item.meta_keywords || '',
      is_active: item.is_active,
    });
    setSlugError('');
    setActiveTab('basic');
    setDialogOpen(true);
  };

  const handleNameChange = (value: string) => {
    const next = { ...formData, name_uz: value };
    if (!formData.slug || formData.slug === generateSlug(formData.name_uz)) {
      next.slug = generateSlug(value);
    }
    setFormData(next);
  };

  const checkSlugUnique = (slug: string, excludeId?: string) =>
    !furniture.some((f) => f.slug === slug && f.id !== excludeId);

  const handleSlugChange = (value: string) => {
    const cleanSlug = value.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-');
    setFormData({ ...formData, slug: cleanSlug });
    if (cleanSlug) {
      setSlugError(checkSlugUnique(cleanSlug, selected?.id) ? '' : t.slugTaken);
    } else {
      setSlugError('');
    }
  };

  const handleImageUpload = async (file: File) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast({ variant: 'destructive', title: t.error, description: t.imageTypeError });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: 'destructive', title: t.error, description: t.imageSizeError });
      return;
    }

    setImageUploading(true);
    try {
      const uploadFile = await convertImageToWebP(file);
      const fileExt = uploadFile.name.split('.').pop();
      const fileName = `furniture-${Date.now()}.${fileExt}`;
      const fd = new FormData();
      fd.append('file', uploadFile);
      fd.append('path', `furniture/${fileName}`);
      const { url } = await apiUpload<{ url: string }>('/api/uploads', fd);
      setFormData((prev) => ({ ...prev, image: url }));
    } catch (error: any) {
      toast({ variant: 'destructive', title: t.error, description: error.message });
    } finally {
      setImageUploading(false);
    }
  };

  const handleAddCategory = async () => {
    const nameUz = newCategoryName.uz.trim();
    const nameRu = newCategoryName.ru.trim() || nameUz;
    if (!nameUz) return;
    try {
      const { item } = await apiPost<{ item: any }>('/api/furniture-categories', {
        nameUz,
        nameRu,
        slug: generateSlug(nameUz) || `kategoriya-${Date.now()}`,
        sortOrder: furnitureCategories.length,
      });
      await refetchCategories();
      setFormData((prev) => ({ ...prev, category_id: item.id }));
      setNewCategoryName({ uz: '', ru: '' });
      setNewCategoryOpen(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: t.error, description: error.message });
    }
  };

  const handleSubmit = async () => {
    const nameUz = formData.name_uz.trim();
    const nameRu = formData.name_ru.trim();
    if (!nameUz || !nameRu) {
      toast({ variant: 'destructive', title: t.error, description: t.requiredFields });
      setActiveTab('basic');
      return;
    }

    const slug = formData.slug || generateSlug(nameUz);
    if (!checkSlugUnique(slug, selected?.id)) {
      setSlugError(t.slugTaken);
      setActiveTab('basic');
      return;
    }

    const data = {
      nameUz,
      nameRu,
      slug,
      categoryId: formData.category_id || null,
      brand: formData.brand || null,
      model: formData.model || null,
      article: formData.article || null,
      image: formData.image || null,
      images: formData.images,
      descriptionUz: formData.description_uz || null,
      descriptionRu: formData.description_ru || null,
      fullDescriptionUz: formData.full_description_uz || null,
      fullDescriptionRu: formData.full_description_ru || null,
      specifications: formData.specifications,
      applicationCategoryIds: formData.application_category_ids,
      installationTypeUz: formData.installation_type_uz || null,
      installationTypeRu: formData.installation_type_ru || null,
      usageInstructionsUz: formData.usage_instructions_uz || null,
      usageInstructionsRu: formData.usage_instructions_ru || null,
      installationNotesUz: formData.installation_notes_uz || null,
      installationNotesRu: formData.installation_notes_ru || null,
      metaTitleUz: formData.meta_title_uz || null,
      metaTitleRu: formData.meta_title_ru || null,
      metaDescriptionUz: formData.meta_description_uz || null,
      metaDescriptionRu: formData.meta_description_ru || null,
      metaKeywords: formData.meta_keywords || null,
      isActive: formData.is_active,
    };

    try {
      if (selected) {
        await apiPatch(`/api/furniture/${selected.id}`, data);
        toast({ title: t.success, description: t.updated });
      } else {
        await apiPost('/api/furniture', data);
        toast({ title: t.success, description: t.created });
      }
      setDialogOpen(false);
      refetch();
    } catch (error: any) {
      if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
        setSlugError(t.slugTaken);
      } else {
        toast({ variant: 'destructive', title: t.error, description: error.message });
      }
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      await apiDelete(`/api/furniture/${selected.id}`);
      toast({ title: t.success, description: t.deleted });
      setDeleteDialogOpen(false);
      refetch();
    } catch (error: any) {
      toast({ variant: 'destructive', title: t.error, description: error.message });
    }
  };

  const toggleStatus = async (item: Furniture) => {
    try {
      await apiPatch(`/api/furniture/${item.id}`, { isActive: !item.is_active });
      refetch();
    } catch (error: any) {
      toast({ variant: 'destructive', title: t.error, description: error.message });
    }
  };

  const toggleApplicationCategory = (id: string, checked: boolean) => {
    const next = checked
      ? [...formData.application_category_ids, id]
      : formData.application_category_ids.filter((cid) => cid !== id);
    setFormData({ ...formData, application_category_ids: next });
  };

  if (loading && furniture.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.title}</h1>
          <p className="text-muted-foreground">{t.subtitle}</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          {t.newItem}
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.allCategories}</SelectItem>
            {furnitureCategories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {categoryName(c)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>
            {t.title} ({furniture.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">{t.image}</TableHead>
                <TableHead>{t.name}</TableHead>
                <TableHead>{t.category}</TableHead>
                <TableHead>{t.brand}</TableHead>
                <TableHead>{t.model}</TableHead>
                <TableHead className="text-center">{t.usedIn}</TableHead>
                <TableHead>{t.status}</TableHead>
                <TableHead className="text-right">{t.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {furniture.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name_uz}
                        width={48}
                        height={48}
                        loading="lazy"
                        decoding="async"
                        className="h-12 w-12 rounded-lg border object-cover"
                        onError={(e) => (e.currentTarget.src = '/placeholder.svg')}
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{language === 'ru' ? item.name_ru : item.name_uz}</p>
                    <p className="text-sm text-muted-foreground">{language === 'ru' ? item.name_uz : item.name_ru}</p>
                  </TableCell>
                  <TableCell>
                    {item.category ? (
                      <Badge variant="outline" className="font-normal">
                        {categoryName(item.category)}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>{item.brand || <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell>
                    {[item.model, item.article].filter(Boolean).join(' / ') || (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="gap-1">
                      <Package className="h-3 w-3" />
                      {item.product_count}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.is_active ? 'default' : 'secondary'}>
                      {item.is_active ? t.active : t.inactive}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Switch checked={item.is_active} onCheckedChange={() => toggleStatus(item)} />
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelected(item);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {furniture.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">{t.notFound}</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selected ? t.editTitle : t.newTitle}</DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid h-auto grid-cols-4 gap-1 sm:grid-cols-7">
              <TabsTrigger value="basic" className="text-xs sm:text-sm">{t.tabBasic}</TabsTrigger>
              <TabsTrigger value="description" className="text-xs sm:text-sm">{t.tabDescription}</TabsTrigger>
              <TabsTrigger value="specs" className="text-xs sm:text-sm">{t.tabSpecs}</TabsTrigger>
              <TabsTrigger value="images" className="text-xs sm:text-sm">{t.tabImages}</TabsTrigger>
              <TabsTrigger value="application" className="text-xs sm:text-sm">{t.tabApplication}</TabsTrigger>
              <TabsTrigger value="installation" className="text-xs sm:text-sm">{t.tabInstallation}</TabsTrigger>
              <TabsTrigger value="seo" className="text-xs sm:text-sm">{t.tabSeo}</TabsTrigger>
            </TabsList>

            {/* Asosiy */}
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t.nameUz}</Label>
                  <Input value={formData.name_uz} onChange={(e) => handleNameChange(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t.nameRu}</Label>
                  <Input value={formData.name_ru} onChange={(e) => setFormData({ ...formData, name_ru: e.target.value })} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t.slug}</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder={t.slugAuto}
                  className={slugError ? 'border-destructive' : ''}
                />
                {slugError && <p className="text-sm text-destructive">{slugError}</p>}
              </div>

              <div className="space-y-2">
                <Label>{t.category}</Label>
                <Select
                  value={formData.category_id || 'none'}
                  onValueChange={(v) => {
                    if (v === '__add__') {
                      setNewCategoryOpen(true);
                      return;
                    }
                    setFormData({ ...formData, category_id: v === 'none' ? '' : v });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t.pickCategory} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t.noCategory}</SelectItem>
                    {furnitureCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {categoryName(c)}
                      </SelectItem>
                    ))}
                    <SelectItem value="__add__">{t.addCategory}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t.brandLabel}</Label>
                  <Input value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{t.modelLabel}</Label>
                  <Input value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t.articleLabel}</Label>
                <Input value={formData.article} onChange={(e) => setFormData({ ...formData, article: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t.shortDescUz}</Label>
                  <Textarea
                    value={formData.description_uz}
                    onChange={(e) => setFormData({ ...formData, description_uz: e.target.value })}
                    rows={2}
                  />
                  <p className="text-xs text-muted-foreground">{t.shortDescUzHint}</p>
                </div>
                <div className="space-y-2">
                  <Label>{t.shortDescRu}</Label>
                  <Textarea
                    value={formData.description_ru}
                    onChange={(e) => setFormData({ ...formData, description_ru: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>{t.active_}</Label>
              </div>
            </TabsContent>

            {/* Tavsif */}
            <TabsContent value="description" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>{t.fullDescUz}</Label>
                <Textarea
                  value={formData.full_description_uz}
                  onChange={(e) => setFormData({ ...formData, full_description_uz: e.target.value })}
                  rows={6}
                />
              </div>
              <div className="space-y-2">
                <Label>{t.fullDescRu}</Label>
                <Textarea
                  value={formData.full_description_ru}
                  onChange={(e) => setFormData({ ...formData, full_description_ru: e.target.value })}
                  rows={6}
                />
              </div>
            </TabsContent>

            {/* Xususiyatlar */}
            <TabsContent value="specs" className="space-y-4 mt-4">
              <AttributesEditor
                value={formData.specifications}
                onChange={(v) => setFormData({ ...formData, specifications: v })}
                language={language as 'uz' | 'ru'}
              />
            </TabsContent>

            {/* Rasmlar */}
            <TabsContent value="images" className="space-y-6 mt-4">
              <div className="space-y-2">
                <Label>{t.mainImage}</Label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                    e.target.value = '';
                  }}
                />
                {formData.image ? (
                  <div className="relative inline-block">
                    <img
                      src={formData.image}
                      alt="Preview"
                      width={112}
                      height={112}
                      loading="lazy"
                      decoding="async"
                      className="h-28 w-28 rounded-lg border object-cover"
                      onError={(e) => (e.currentTarget.src = '/placeholder.svg')}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
                      onClick={() => setFormData((prev) => ({ ...prev, image: '' }))}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="flex h-28 w-28 flex-col items-center justify-center gap-2 border-dashed"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={imageUploading}
                  >
                    {imageUploading ? (
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <Plus className="h-7 w-7 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{t.uploadImage}</span>
                      </>
                    )}
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label>{t.gallery}</Label>
                <FurnitureGalleryUploader
                  images={formData.images}
                  onChange={(images) => setFormData({ ...formData, images })}
                  uploadLabel={t.addGalleryImage}
                  errorTitle={t.error}
                />
              </div>
            </TabsContent>

            {/* Qo'llanilishi */}
            <TabsContent value="application" className="space-y-2 mt-4">
              <p className="text-xs text-muted-foreground">{t.applicationHint}</p>
              {productCategories.length === 0 ? (
                <p className="text-sm italic text-muted-foreground">{t.noCategories}</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 rounded-md border p-3">
                  {productCategories.map((c) => {
                    const checked = formData.application_category_ids.includes(c.id);
                    return (
                      <label
                        key={c.id}
                        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(v) => toggleApplicationCategory(c.id, !!v)}
                        />
                        <span className="truncate text-sm">{language === 'ru' ? c.name_ru : c.name_uz}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* O'rnatish */}
            <TabsContent value="installation" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t.installationTypeUz}</Label>
                  <Input
                    value={formData.installation_type_uz}
                    onChange={(e) => setFormData({ ...formData, installation_type_uz: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t.installationTypeRu}</Label>
                  <Input
                    value={formData.installation_type_ru}
                    onChange={(e) => setFormData({ ...formData, installation_type_ru: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t.usageInstructionsUz}</Label>
                  <Textarea
                    value={formData.usage_instructions_uz}
                    onChange={(e) => setFormData({ ...formData, usage_instructions_uz: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t.usageInstructionsRu}</Label>
                  <Textarea
                    value={formData.usage_instructions_ru}
                    onChange={(e) => setFormData({ ...formData, usage_instructions_ru: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t.installationNotesUz}</Label>
                  <Textarea
                    value={formData.installation_notes_uz}
                    onChange={(e) => setFormData({ ...formData, installation_notes_uz: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t.installationNotesRu}</Label>
                  <Textarea
                    value={formData.installation_notes_ru}
                    onChange={(e) => setFormData({ ...formData, installation_notes_ru: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
            </TabsContent>

            {/* SEO */}
            <TabsContent value="seo" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t.metaTitleUz}</Label>
                  <Input
                    value={formData.meta_title_uz}
                    onChange={(e) => setFormData({ ...formData, meta_title_uz: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t.metaTitleRu}</Label>
                  <Input
                    value={formData.meta_title_ru}
                    onChange={(e) => setFormData({ ...formData, meta_title_ru: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t.metaDescUz}</Label>
                  <Textarea
                    value={formData.meta_description_uz}
                    onChange={(e) => setFormData({ ...formData, meta_description_uz: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t.metaDescRu}</Label>
                  <Textarea
                    value={formData.meta_description_ru}
                    onChange={(e) => setFormData({ ...formData, meta_description_ru: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t.metaKeywords}</Label>
                <Input
                  value={formData.meta_keywords}
                  onChange={(e) => setFormData({ ...formData, meta_keywords: e.target.value })}
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t.cancel}
            </Button>
            <Button onClick={handleSubmit} disabled={!!slugError}>
              {selected ? t.save : t.create}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New category mini-dialog */}
      <Dialog open={newCategoryOpen} onOpenChange={setNewCategoryOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t.newCategoryTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>{t.newCategoryNameUz}</Label>
              <Input
                value={newCategoryName.uz}
                onChange={(e) => setNewCategoryName({ ...newCategoryName, uz: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t.newCategoryNameRu}</Label>
              <Input
                value={newCategoryName.ru}
                onChange={(e) => setNewCategoryName({ ...newCategoryName, ru: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewCategoryOpen(false)}>
              {t.cancel}
            </Button>
            <Button onClick={handleAddCategory} disabled={!newCategoryName.uz.trim()}>
              {t.create}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {(selected?.product_count || 0) > 0 && <AlertTriangle className="h-5 w-5 text-amber-500" />}
              {t.deleteTitle}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selected && (selected.product_count || 0) > 0
                ? t.usedInProducts(language === 'ru' ? selected.name_ru : selected.name_uz, selected.product_count)
                : t.confirmDelete(selected ? (language === 'ru' ? selected.name_ru : selected.name_uz) : '')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {t.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
