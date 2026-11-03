import { getPricingCopy } from '@/lib/pricingCopy';

interface OrderPricingNoteProps {
  requiresQuote: boolean;
  totalPrice: number;
  language: string;
  currency: string;
}

export function OrderPricingNote({ requiresQuote, totalPrice, language, currency }: OrderPricingNoteProps) {
  if (!requiresQuote) return null;
  const copy = getPricingCopy(language);

  return (
    <div className="space-y-1 text-sm text-muted-foreground">
      {totalPrice > 0 && (
        <p>{copy.knownSubtotal}: {totalPrice.toLocaleString('uz-UZ')} {currency}.</p>
      )}
      <p>{copy.explanation}</p>
    </div>
  );
}
