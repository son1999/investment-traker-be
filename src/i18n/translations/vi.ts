export const vi = {
  // Auth
  INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng',
  INVALID_REFRESH_TOKEN: 'Refresh token không hợp lệ hoặc đã hết hạn',
  GUEST_READ_ONLY: 'Tài khoản khách chỉ được xem. Không thể thêm, sửa hoặc xóa dữ liệu.',
  MISSING_AUTH_HEADER: 'Thiếu hoặc sai header xác thực',
  INVALID_TOKEN: 'Token không hợp lệ hoặc đã hết hạn',

  // Allocation
  TARGET_SUM_INVALID: 'Tổng phần trăm mục tiêu phải bằng 100. Tổng hiện tại: {total}',
  REBALANCE_RECOMMENDED: 'Danh mục đã lệch khỏi mục tiêu chiến lược. Khuyến nghị tái cân bằng.',
  PORTFOLIO_BALANCED: 'Danh mục đã cân bằng tốt. Không cần tái cân bằng.',
  SELL_RECOMMENDATION: 'Bán ~{amount}M VND {name}',
  BUY_RECOMMENDATION: 'Mua ~{amount}M VND {name}',

  // Assets
  ASSET_NOT_FOUND: 'Không tìm thấy tài sản {code}',
  ASSET_ALREADY_EXISTS: 'Tài sản {code} đã tồn tại',
  ASSET_HAS_TRANSACTIONS: 'Không thể xóa tài sản {code}. Có {count} giao dịch liên quan. Hãy xóa giao dịch trước.',
  ASSET_NOT_REGISTERED: 'Tài sản {code} chưa được đăng ký. Vui lòng tạo tài sản trước.',
  HOLDINGS_DETAIL: '{buyCount} lệnh mua · {sellCount} lệnh bán',

  // Currencies
  CURRENCY_NOT_FOUND: 'Không tìm thấy loại tiền {code}',
  CURRENCY_ALREADY_EXISTS: 'Loại tiền {code} đã tồn tại',
  CURRENCY_IN_USE: 'Không thể xóa loại tiền {code}. Có {count} tài sản đang sử dụng.',

  // Prices
  PRICE_NOT_FOUND: 'Không tìm thấy giá cho {code}',

  // Transactions
  INSUFFICIENT_HOLDINGS: 'Không đủ số lượng nắm giữ. Khả dụng: {available}, yêu cầu: {requested}',
  TRANSACTION_NOT_FOUND: 'Không tìm thấy giao dịch',

  // Savings
  SAVINGS_EVENT_NOT_FOUND: 'Không tìm thấy giao dịch tiết kiệm',
  INSUFFICIENT_BALANCE: 'Số dư không đủ. Khả dụng: {balance}',

  // Goals
  GOAL_NOT_FOUND: 'Không tìm thấy mục tiêu tài chính',

  // CSV Import
  CSV_EMPTY_FILE: 'File CSV trống',
  CSV_INVALID_FORMAT: 'Định dạng CSV không hợp lệ',

  // HTTP errors
  INTERNAL_SERVER_ERROR: 'Lỗi máy chủ nội bộ',
  BAD_REQUEST: 'Yêu cầu không hợp lệ',
  UNAUTHORIZED: 'Chưa xác thực',
  FORBIDDEN: 'Không có quyền truy cập',
  NOT_FOUND: 'Không tìm thấy',
  CONFLICT: 'Xung đột dữ liệu',
};
