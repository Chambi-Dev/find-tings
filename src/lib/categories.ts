import {
  Headphones,
  Smartphone,
  Glasses,
  Shirt,
  Key,
  HardDrive,
  Package,
  type LucideIcon,
} from 'lucide-react';

export interface CategoryInfo {
  value: string;
  label: string;
  icon: LucideIcon;
}

export const CATEGORIAS: CategoryInfo[] = [
  { value: 'audifonos', label: 'Audífonos', icon: Headphones },
  { value: 'telefono', label: 'Teléfono', icon: Smartphone },
  { value: 'lentes', label: 'Lentes', icon: Glasses },
  { value: 'ropa', label: 'Ropa', icon: Shirt },
  { value: 'llaves', label: 'Llaves', icon: Key },
  { value: 'usb', label: 'USB / Memoria', icon: HardDrive },
  { value: 'otros', label: 'Otros', icon: Package },
];

export const CATEGORIA_MAP: Record<string, { label: string; icon: LucideIcon }> = {
  audifonos: { label: 'Audífonos', icon: Headphones },
  telefono: { label: 'Teléfono', icon: Smartphone },
  lentes: { label: 'Lentes', icon: Glasses },
  ropa: { label: 'Ropa', icon: Shirt },
  llaves: { label: 'Llaves', icon: Key },
  usb: { label: 'USB / Memoria', icon: HardDrive },
  otros: { label: 'Otros', icon: Package },
};

export function getCategoryInfo(value: string) {
  return CATEGORIA_MAP[value] || { label: value, icon: Package };
}
