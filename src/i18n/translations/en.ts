export const en = {
  // Auth
  INVALID_CREDENTIALS: 'Invalid email or password',
  MISSING_AUTH_HEADER: 'Missing or invalid authorization header',
  INVALID_TOKEN: 'Invalid or expired token',

  // Allocation
  TARGET_SUM_INVALID: 'Target percentages must sum to 100. Current total: {total}',
  REBALANCE_RECOMMENDED: 'Portfolio has deviated from strategic targets. Rebalancing recommended.',
  PORTFOLIO_BALANCED: 'Portfolio is well-balanced. No rebalancing needed.',
  SELL_RECOMMENDATION: 'Sell ~{amount}M VND of {name}',
  BUY_RECOMMENDATION: 'Buy ~{amount}M VND of {name}',

  // Assets
  ASSET_NOT_FOUND: 'Asset {code} not found',
  ASSET_ALREADY_EXISTS: 'Asset {code} already exists',
  ASSET_HAS_TRANSACTIONS: 'Cannot delete asset {code}. It has {count} transactions. Delete transactions first.',
  ASSET_NOT_REGISTERED: 'Asset {code} is not registered. Please create the asset first.',
  HOLDINGS_DETAIL: '{buyCount} buy orders · {sellCount} sell orders',

  // Currencies
  CURRENCY_NOT_FOUND: 'Currency {code} not found',
  CURRENCY_ALREADY_EXISTS: 'Currency {code} already exists',
  CURRENCY_IN_USE: 'Cannot delete currency {code}. {count} assets are using it.',

  // Prices
  PRICE_NOT_FOUND: 'Price for {code} not found',

  // Transactions
  INSUFFICIENT_HOLDINGS: 'Insufficient holdings. Available: {available}, requested: {requested}',
  TRANSACTION_NOT_FOUND: 'Transaction not found',

  // Goals
  GOAL_NOT_FOUND: 'Financial goal not found',

  // CSV Import
  CSV_EMPTY_FILE: 'CSV file is empty',
  CSV_INVALID_FORMAT: 'Invalid CSV format',

  // HTTP errors
  INTERNAL_SERVER_ERROR: 'Internal server error',
  BAD_REQUEST: 'Bad Request',
  UNAUTHORIZED: 'Unauthorized',
  FORBIDDEN: 'Forbidden',
  NOT_FOUND: 'Not Found',
  CONFLICT: 'Conflict',
};
