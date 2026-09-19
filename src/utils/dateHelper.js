/**
 * ==============================================================================
 * DATE & TIME HELPER
 * ==============================================================================
 */

export function formatMealTime(isoString, type = 'lunch') {
  const date = new Date(isoString);
  const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const typeMap = {
    breakfast: 'Bữa Sáng',
    lunch: 'Bữa Trưa',
    dinner: 'Bữa Tối',
    snack: 'Ăn Vặt'
  };
  return `${timeStr} • ${typeMap[type] || 'Bữa Ăn'}`;
}

export function formatDayMonth(date) {
  return date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'long' });
}

export function getMonthNames() {
  return ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];
}
