# Prompt cho FE: 4 tính năng mới Backend

> File `api-docs.json` đã được cập nhật đầy đủ. Dùng file đó làm API reference chính.

---

## 1. Tiết kiệm (Savings Asset Type)

### Mô tả
Thêm loại tài sản mới `savings` cho sổ tiết kiệm ngân hàng. Ngoài các field cơ bản (code, name, icon), savings có thêm: lãi suất, kỳ hạn, tên ngân hàng, ngày đáo hạn.

### API thay đổi
- `AssetType` giờ là: `metal | crypto | stock | savings`
- `POST /api/assets` - thêm fields:
  - `interestRate` (number, bắt buộc khi type=savings) - lãi suất năm %
  - `termMonths` (number, bắt buộc khi type=savings) - kỳ hạn (tháng)
  - `bankName` (string, tùy chọn) - tên ngân hàng
  - `maturityDate` (string, tùy chọn) - ngày đáo hạn
- `PATCH /api/assets/:code` - cũng hỗ trợ cập nhật các field trên
- Allocation, Portfolio, Reports - tất cả đều trả về `savings` như 1 asset type mới

### Gợi ý UI
- Form tạo asset: khi chọn type = "savings", hiển thị thêm các field lãi suất, kỳ hạn, ngân hàng, ngày đáo hạn
- Dashboard allocation pie chart: thêm slice "Savings" (gợi ý màu xanh lá #22c55e)
- Holdings list: hiển thị savings assets cùng với các loại khác
- Asset detail: hiển thị thông tin lãi suất, kỳ hạn, tên ngân hàng
- Filter dropdown: thêm option "Savings" / "Tiết kiệm"

---

## 2. Import CSV Giao dịch

### Mô tả
Cho phép import hàng loạt giao dịch từ file CSV. Endpoint trả về số lượng thành công và danh sách lỗi chi tiết theo từng dòng.

### API
```
POST /api/transactions/import-csv
Content-Type: multipart/form-data
Body: file (CSV file)
```

### CSV Format
```csv
date,assetType,assetCode,action,quantity,unitPrice,note
2025-01-15,crypto,BTC,MUA,0.5,1500000000,Monthly DCA
2025-02-15,crypto,BTC,MUA,0.3,1600000000,
2025-03-01,metal,SJC,MUA,1,92500000,Mua vàng
```

- Header row bắt buộc
- Cột bắt buộc: date, assetType, assetCode, action, quantity, unitPrice
- Cột tùy chọn: note, icon, iconBg (nếu không có icon/iconBg, BE tự lấy từ asset đã đăng ký)
- Hỗ trợ alias: `type` → assetType, `code` → assetCode, `price` → unitPrice

### Response
```json
{
  "data": {
    "successCount": 8,
    "errorCount": 2,
    "errors": [
      { "row": 5, "message": "Asset XYZ not registered" },
      { "row": 9, "message": "Insufficient holdings for BTC. Available: 0.5, requested: 1" }
    ]
  }
}
```

### Gợi ý UI
- Nút "Import CSV" trong trang Transactions
- File picker chấp nhận `.csv`
- Sau khi upload hiển thị kết quả: "Đã import 8/10 giao dịch"
- Nếu có lỗi, hiển thị bảng lỗi: dòng nào, lỗi gì
- Có thể thêm link download CSV mẫu
- Toast notification khi import thành công

---

## 3. API Giá Real-time (CoinGecko + VnStock)

### Mô tả
Backend giờ có thể tự động fetch giá từ CoinGecko (crypto) và CafeF (cổ phiếu VN - HOSE + HNX). Giá crypto cache 5 phút. Cổ phiếu: cache 5 phút trong giờ giao dịch (9h-15h VN), cache 1 giờ ngoài giờ. CafeF free, không cần API key.

### API mới

#### Refresh tất cả giá
```
POST /api/prices/refresh
```
Response:
```json
{
  "data": {
    "updated": [
      { "code": "BTC", "type": "crypto", "price": 2750000000 },
      { "code": "VNM", "type": "stock", "price": 78500 }
    ],
    "count": 2
  }
}
```

#### Lấy giá live 1 asset
```
GET /api/prices/:code/live?type=crypto
```
Response:
```json
{
  "data": {
    "code": "BTC",
    "type": "crypto",
    "price": 2750000000
  }
}
```

### Crypto hỗ trợ
BTC, ETH, USDT, BNB, SOL, XRP, ADA, DOGE, DOT, MATIC, LINK, UNI, AVAX, ATOM, NEAR, APT, SUI

### Gợi ý UI
- Nút "Refresh Prices" / "Cập nhật giá" trên Dashboard hoặc trang Prices
- Khi click gọi `POST /api/prices/refresh`, hiển thị loading spinner
- Sau khi refresh, cập nhật lại portfolio summary, holdings, charts
- Hiển thị thời gian cập nhật cuối (từ `updatedAt` trong price data)
- Có thể auto-refresh mỗi 5 phút khi user đang xem Dashboard
- Indicator cho stock: "Ngoài giờ giao dịch" khi ngoài 9h-15h (giá vẫn hiển thị = giá cuối phiên)
- Metal & Savings: vẫn nhập giá thủ công (không có auto-fetch)

---

## 4. Mục tiêu tài chính (Financial Goals)

### Mô tả
Cho phép tạo mục tiêu tài chính với số tiền target, deadline, và theo dõi tiến độ. Có 2 mode:
- **Linked mode**: Gắn với các asset cụ thể → tiến độ tự tính từ giá trị portfolio
- **Manual mode**: Không gắn asset → user tự nhập currentAmount

### API
```
GET    /api/goals          - List all goals + progress
GET    /api/goals/summary  - Tổng hợp (total, on-track, at-risk, completed)
GET    /api/goals/:id      - Chi tiết 1 goal
POST   /api/goals          - Tạo mới
PATCH  /api/goals/:id      - Cập nhật
DELETE /api/goals/:id      - Xóa
```

### Create Request
```json
{
  "name": "Emergency Fund",
  "targetAmount": 100000000,
  "deadline": "2027-01-01",
  "linkedAssets": ["BTC", "ETH"],
  "icon": "🎯",
  "iconBg": "rgba(59,130,246,0.2)"
}
```

### Progress Response
Mỗi goal trả về kèm `progress`:
```json
{
  "progress": {
    "currentValue": 65000000,
    "targetAmount": 100000000,
    "progressPercent": 65,
    "remainingAmount": 35000000,
    "daysRemaining": 267,
    "onTrack": true
  }
}
```

- `progressPercent`: 0-100, capped at 100
- `onTrack`: linear projection - tốc độ hiện tại có đạt target trước deadline không
- `daysRemaining`: số ngày còn lại đến deadline

### Summary Response
```json
{
  "data": {
    "totalGoals": 3,
    "onTrackCount": 1,
    "atRiskCount": 1,
    "completedCount": 1
  }
}
```

### Gợi ý UI
- Trang "Mục tiêu" mới trong sidebar/navigation
- Dashboard widget: hiển thị summary (X on-track, Y at-risk, Z completed)
- Mỗi goal card hiển thị:
  - Icon + tên
  - Progress bar (0-100%)
  - Số tiền hiện tại / mục tiêu (VD: "65M / 100M VND")
  - Deadline + số ngày còn lại
  - Badge trạng thái: On Track (xanh), At Risk (vàng/đỏ), Completed (xanh lá ✓)
  - Danh sách linked assets (nếu có)
- Form tạo/sửa goal:
  - Name, target amount, deadline (date picker)
  - Toggle: "Gắn với tài sản" → multi-select asset codes
  - Hoặc: "Nhập thủ công" → input currentAmount
  - Icon picker
- Nút xóa goal (có confirm dialog)
