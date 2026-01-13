export function getEnumKeysAndValues<T extends object>(enumObj: T): Array<{ name: string, value: any }> {
  return Object.keys(enumObj)
    .filter(key => isNaN(Number(key)))
    .map(key => ({
      name: key,
      value: enumObj[key as keyof T]
    }));
}

// Alternative with better typing
export function getEnumEntries<T extends Record<string, string | number>>(enumObj: T): Array<{ name: keyof T, value: T[keyof T] }> {
  return Object.keys(enumObj)
    .filter(key => isNaN(Number(key)))
    .map(key => ({
      name: key as keyof T,
      value: enumObj[key as keyof T]
    } as { name: keyof T, value: T[keyof T] }));
}

// Another alternative that preserves TypeScript types better
export function enumToArray<T extends object>(enumObj: T): Array<{ name: string, value: any }> {
  return Object.entries(enumObj)
    .filter(([key, value]) => !isNaN(Number(value)))
    .map(([key, value]) => ({
      name: key,
      value: Number(value)
    }));
}