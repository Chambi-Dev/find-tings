/**
 * Normaliza un número telefónico para WhatsApp (con soporte prioritario para Perú).
 * - Si ingresa "987654321" (9 dígitos estándar de Perú) -> "51987654321"
 * - Si ingresa "+51 987654321" o "51987654321" -> "51987654321"
 * - Si ingresa cualquier otro formato con guiones/espacios -> lo limpia correctamente
 */
export function normalizeWhatsappNumber(rawPhone: string): string {
  if (!rawPhone) return '';
  const digitsOnly = rawPhone.replace(/\D/g, '');

  if (!digitsOnly) return '';

  // Si tiene 9 dígitos (celular estándar en Perú)
  if (digitsOnly.length === 9) {
    return `51${digitsOnly}`;
  }

  // Si tiene 11 dígitos y ya empieza con 51 (ej. 51987654321)
  if (digitsOnly.length === 11 && digitsOnly.startsWith('51')) {
    return digitsOnly;
  }

  return digitsOnly;
}

/**
 * Formatea para mostrar al usuario de manera legible (ej: "+51 987 654 321")
 */
export function formatPhoneDisplay(rawPhone: string): string {
  const normalized = normalizeWhatsappNumber(rawPhone);
  if (normalized.length === 11 && normalized.startsWith('51')) {
    const mobile = normalized.slice(2);
    return `+51 ${mobile.slice(0, 3)} ${mobile.slice(3, 6)} ${mobile.slice(6)}`;
  }
  return rawPhone.trim();
}

/**
 * Genera el enlace directo a wa.me listo para abrir chat
 */
export function getWhatsappLink(rawPhone: string, message: string = ''): string | null {
  const clean = normalizeWhatsappNumber(rawPhone);
  if (!clean || clean.length < 8) return null;
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${clean}${encoded ? `?text=${encoded}` : ''}`;
}
