export const ASSET_TYPES = ['metal', 'crypto', 'stock', 'savings'] as const;
export type AssetType = (typeof ASSET_TYPES)[number];
