/** Confirmed public contact, used while settings load or contain no phone. */
export const DEFAULT_CONTACT_PHONE = '+998920248636';

export function resolveContactPhone(value?: string | null) {
  const configured = value?.trim() || '';
  const phone = /\d/.test(configured) ? configured : DEFAULT_CONTACT_PHONE;
  const digits = phone.replace(/\D/g, '');
  const display = /^998\d{9}$/.test(digits)
    ? `+998 ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10)}`
    : phone;

  return {
    display,
    href: `tel:${display.startsWith('+') ? '+' : ''}${digits}`,
  };
}
