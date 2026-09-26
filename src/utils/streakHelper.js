/**
 * ==============================================================================
 * STREAK HELPER
 * Calculates the consecutive daily food streak between partners
 * ==============================================================================
 */

/**
 * Calculates current consecutive day streak based on meal dates.
 * Considers both current user's meals and partner's meals.
 * 
 * Rules:
 * - A day counts if at least one meal was posted by either person on that local calendar day.
 * - If meals exist today: count backwards consecutive days from today.
 * - If no meal today yet, but meal existed yesterday: streak remains active (from yesterday).
 * - If no meal today and no meal yesterday: streak is broken (0).
 * 
 * @param {Array} meals - List of meal objects
 * @param {Object} currentUser - Current user profile
 * @param {Object} partner - Connected partner profile
 * @returns {number} Active streak count in days
 */
export function calculateCoupleStreak(meals = [], currentUser = null, partner = null) {
  if (!Array.isArray(meals) || meals.length === 0) return 0;

  // Collect relevant meals
  const relevantMeals = meals.filter(m => {
    if (!m || !m.created_at) return false;
    if (partner?.id) {
      return m.user_id === currentUser?.id || m.user_id === partner.id;
    }
    return m.user_id === currentUser?.id;
  });

  if (relevantMeals.length === 0) return 0;

  // Build a set of unique local dates (YYYY-MM-DD)
  const formatLocalDate = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const activeDates = new Set();
  relevantMeals.forEach(m => {
    const d = new Date(m.created_at);
    if (!isNaN(d.getTime())) {
      activeDates.add(formatLocalDate(d));
    }
  });

  const today = new Date();
  const todayStr = formatLocalDate(today);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatLocalDate(yesterday);

  // Check where streak starts
  let checkDate;
  if (activeDates.has(todayStr)) {
    checkDate = new Date(today);
  } else if (activeDates.has(yesterdayStr)) {
    checkDate = new Date(yesterday);
  } else {
    return 0; // Streak broken
  }

  // Count backwards day by day
  let streak = 0;
  const cursor = new Date(checkDate);
  while (true) {
    const dateStr = formatLocalDate(cursor);
    if (activeDates.has(dateStr)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}
