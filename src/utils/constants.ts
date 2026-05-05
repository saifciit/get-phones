export const ALLOWED_BRANDS = [
  'Samsung', 'Apple', 'Xiaomi', 'OnePlus', 'Oppo', 'Vivo',
  'Realme', 'Tecno', 'Infinix', 'Nokia', 'Motorola', 'Google',
  'Huawei', 'Nothing',
];

export const ALLOWED_CITIES = [
  'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Peshawar',
  'Quetta', 'Multan', 'Faisalabad', 'Abbottabad', 'Sialkot',
  'Gujranwala', 'Hyderabad', 'Sukkur', 'Mardan',
];

export const CONDITIONS = [
  { value: 'brandNew', label: 'Brand New' },
  { value: 'likeNew',  label: 'Like New' },
  { value: 'good',     label: 'Good'     },
  { value: 'fair',     label: 'Fair'     },
] as const;

export type ConditionValue = typeof CONDITIONS[number]['value'];

export function isBrandAllowed(brand: string): boolean {
  return ALLOWED_BRANDS.some(b => b.toLowerCase() === brand.toLowerCase());
}

export function isCityAllowed(city: string): boolean {
  return ALLOWED_CITIES.some(c => c.toLowerCase() === city.toLowerCase());
}

export function isConditionAllowed(cond: string): cond is ConditionValue {
  return CONDITIONS.some(c => c.value === cond);
}

/** Normalise to the canonical casing stored in DB */
export function normaliseBrand(brand: string): string {
  return ALLOWED_BRANDS.find(b => b.toLowerCase() === brand.toLowerCase()) || brand;
}

export function normaliseCity(city: string): string {
  return ALLOWED_CITIES.find(c => c.toLowerCase() === city.toLowerCase()) || city;
}
