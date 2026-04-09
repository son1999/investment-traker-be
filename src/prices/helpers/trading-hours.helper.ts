/**
 * Check if current time is within Vietnam stock market trading hours.
 * Trading hours: 9:00 - 15:00 ICT (UTC+7), Monday - Friday.
 */
export function isVietnamTradingHours(): boolean {
  const now = new Date();
  const vietnamTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  const day = vietnamTime.getDay();
  const hour = vietnamTime.getHours();

  // Weekend
  if (day === 0 || day === 6) return false;

  // 9:00 - 15:00
  return hour >= 9 && hour < 15;
}
