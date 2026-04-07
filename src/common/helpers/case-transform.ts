export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

export function transformKeys<T extends Record<string, any>>(
  obj: T,
  transformer: (key: string) => string,
): Record<string, any> {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) => transformKeys(item, transformer)) as any;
  }
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [
      transformer(key),
      value && typeof value === 'object' && !(value instanceof Date)
        ? transformKeys(value, transformer)
        : value,
    ]),
  );
}

export function dbToDto<T>(obj: any): T {
  return transformKeys(obj, snakeToCamel) as T;
}

export function dtoToDb(obj: Record<string, any>): Record<string, any> {
  return transformKeys(obj, camelToSnake);
}
