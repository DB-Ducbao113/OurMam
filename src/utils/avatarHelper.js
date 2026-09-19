/**
 * ==============================================================================
 * AVATAR HELPER
 * Generates clean, aesthetic personalized avatar based on user's name/initials
 * ==============================================================================
 */

export function getUserAvatar(avatarUrl, name = 'Bạn') {
  if (avatarUrl && !avatarUrl.includes('unsplash.com') && !avatarUrl.includes('photo-1534528741775') && !avatarUrl.includes('photo-1539571696357')) {
    return avatarUrl;
  }
  const cleanName = encodeURIComponent((name || 'Bạn').replace(/[^\p{L}\p{N}\s]/gu, '').trim() || 'U');
  return `https://ui-avatars.com/api/?name=${cleanName}&background=FF7A53&color=fff&bold=true&size=256`;
}
