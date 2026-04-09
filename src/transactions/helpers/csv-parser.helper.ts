import { parse } from 'csv-parse/sync';

export interface ParsedTransaction {
  date: string;
  assetType: string;
  assetCode: string;
  action: string;
  quantity: number;
  unitPrice: number;
  note?: string;
  icon: string;
  iconBg: string;
}

export interface CsvParseError {
  row: number;
  message: string;
}

export interface CsvParseResult {
  parsed: ParsedTransaction[];
  errors: CsvParseError[];
}

const COLUMN_ALIASES: Record<string, string> = {
  type: 'assetType',
  asset_type: 'assetType',
  code: 'assetCode',
  asset_code: 'assetCode',
  price: 'unitPrice',
  unit_price: 'unitPrice',
  icon_bg: 'iconBg',
};

const VALID_TYPES = ['metal', 'crypto', 'stock', 'savings'];
const VALID_ACTIONS = ['MUA', 'BAN'];

export function parseCsvBuffer(buffer: Buffer): CsvParseResult {
  const content = buffer.toString('utf-8');
  const parsed: ParsedTransaction[] = [];
  const errors: CsvParseError[] = [];

  let records: Record<string, string>[];
  try {
    records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
    });
  } catch {
    return { parsed: [], errors: [{ row: 0, message: 'Invalid CSV format' }] };
  }

  if (records.length === 0) {
    return { parsed: [], errors: [{ row: 0, message: 'CSV file is empty' }] };
  }

  records.forEach((record, index) => {
    const row = index + 2; // +2 for 1-based + header row
    const normalized: Record<string, string> = {};

    // Normalize column names
    for (const [key, value] of Object.entries(record)) {
      const normalizedKey = COLUMN_ALIASES[key.toLowerCase()] || key;
      normalized[normalizedKey] = value;
    }

    // Validate required fields
    if (!normalized.date) {
      errors.push({ row, message: 'Missing date' });
      return;
    }
    if (!normalized.assetType || !VALID_TYPES.includes(normalized.assetType)) {
      errors.push({ row, message: `Invalid assetType: ${normalized.assetType}` });
      return;
    }
    if (!normalized.assetCode) {
      errors.push({ row, message: 'Missing assetCode' });
      return;
    }
    const action = normalized.action?.toUpperCase();
    if (!action || !VALID_ACTIONS.includes(action)) {
      errors.push({ row, message: `Invalid action: ${normalized.action}` });
      return;
    }
    const quantity = parseFloat(normalized.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      errors.push({ row, message: `Invalid quantity: ${normalized.quantity}` });
      return;
    }
    const unitPrice = parseFloat(normalized.unitPrice);
    if (isNaN(unitPrice) || unitPrice <= 0) {
      errors.push({ row, message: `Invalid unitPrice: ${normalized.unitPrice}` });
      return;
    }

    parsed.push({
      date: normalized.date,
      assetType: normalized.assetType,
      assetCode: normalized.assetCode,
      action,
      quantity,
      unitPrice,
      note: normalized.note || undefined,
      icon: normalized.icon || '',
      iconBg: normalized.iconBg || '',
    });
  });

  return { parsed, errors };
}
