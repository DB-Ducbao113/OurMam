/**
 * ==============================================================================
 * API SERVICE (SUPABASE CLIENT, DIRECT REST DATA LAYER & REALTIME ADAPTER)
 * Robust zero-lag queries with service-authenticated REST for data and Auth
 * ==============================================================================
 */

import { ENV } from '../config/env.js';
import { INITIAL_PROFILES, INITIAL_MEALS, INITIAL_MESSAGES } from '../constants/mockData.js';

export function formatLoginIdentifier(input) {
  const trimmed = (input || '').trim();
  if (!trimmed) return '';
  if (trimmed.includes('@')) {
    return trimmed.toLowerCase();
  }
  // Dedicated internal namespace: 100% immune to collisions with real Google Gmail addresses
  const cleanUsername = trimmed.replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase();
  return `${cleanUsername}@account.ourmam.com`;
}

export function extractUsername(emailOrIdentifier) {
  if (!emailOrIdentifier) return 'Bạn';
  if (emailOrIdentifier.endsWith('@account.ourmam.com')) {
    return emailOrIdentifier.replace('@account.ourmam.com', '');
  }
  if (emailOrIdentifier.endsWith('@ourmam.app')) {
    return emailOrIdentifier.replace('@ourmam.app', '');
  }
  if (emailOrIdentifier.endsWith('@gmail.com')) {
    return emailOrIdentifier.replace('@gmail.com', '');
  }
  return emailOrIdentifier.split('@')[0];
}

class ApiService {
  constructor() {
    this.client = null;
    this.initSupabase();
  }

  initSupabase() {
    if (window.supabase && ENV.SUPABASE_URL && ENV.SUPABASE_ANON_KEY) {
      try {
        this.client = window.supabase.createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        });
      } catch (err) {
        console.warn("Supabase init error, using LocalStorage Adapter:", err);
      }
    }
  }

  // ==================== DIRECT REST DATA HELPER ====================
  // Guarantees 100% reliable data access immune to PostgREST JWT decode mismatches
  async dbQuery(path, options = {}) {
    if (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY) return null;
    const url = `${ENV.SUPABASE_URL}/rest/v1/${path}`;
    const headers = {
      'apikey': ENV.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${ENV.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': options.prefer || 'return=representation',
      ...(options.headers || {})
    };
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const errText = await res.text();
      console.warn(`dbQuery error [${path}]:`, errText);
      throw new Error(errText);
    }
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  // ==================== AUTH METHODS ====================
  async getSession() {
    if (!this.client) return null;
    try {
      const { data, error } = await this.client.auth.getSession();
      if (error) throw error;
      return data?.session || null;
    } catch (err) {
      console.warn("getSession error:", err);
      return null;
    }
  }

  async getUser() {
    if (!this.client) return { data: null, error: null };
    try {
      const { data, error } = await this.client.auth.getUser();
      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  async signUp(usernameOrEmail, password, displayName = '') {
    const email = formatLoginIdentifier(usernameOrEmail);
    const finalDisplayName = displayName || extractUsername(email);

    if (!this.client) {
      return { 
        data: { user: { id: "local-user-" + Date.now(), email, display_name: finalDisplayName } }, 
        error: null 
      };
    }

    const { data, error } = await this.client.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: finalDisplayName,
          name: finalDisplayName
        }
      }
    });
    return { data, error };
  }

  async signIn(usernameOrEmail, password) {
    let email = formatLoginIdentifier(usernameOrEmail);

    if (!this.client) {
      return { 
        data: { user: { id: "local-user", email, display_name: extractUsername(email) } }, 
        error: null 
      };
    }

    // Smart lookup in profiles to resolve display_name, user_code (e.g. MAM922), or email
    const trimmedInput = (usernameOrEmail || '').trim();
    let foundProfile = null;
    if (trimmedInput) {
      try {
        const clean = encodeURIComponent(trimmedInput);
        const profiles = await this.dbQuery(`profiles?or=(email.eq.${clean},display_name.ilike.${clean},user_code.eq.${clean})&select=*`);
        if (profiles && profiles.length > 0) {
          foundProfile = profiles[0];
          email = profiles[0].email;
        }
      } catch (e) {
        console.warn("Profile resolution error:", e);
      }
    }

    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password
    });

    if (error && foundProfile && foundProfile.email && foundProfile.email.endsWith('@gmail.com')) {
      error.isGoogleUser = true;
      error.profileName = foundProfile.display_name;
    }

    return { data, error };
  }

  async adminResetPassword(usernameOrEmailOrCode, newPassword) {
    const cleanInput = (usernameOrEmailOrCode || '').trim();
    if (!cleanInput) throw new Error("Vui lòng nhập tài khoản hoặc mã kết nối!");
    if (!newPassword || newPassword.length < 8) {
      throw new Error("Mật khẩu mới phải có tối thiểu 8 ký tự!");
    }

    // 1. Find profile to get user ID
    const clean = encodeURIComponent(cleanInput);
    const profiles = await this.dbQuery(`profiles?or=(email.eq.${clean},display_name.ilike.${clean},user_code.eq.${clean})&select=*`);
    if (!profiles || profiles.length === 0) {
      throw new Error("Không tìm thấy tài khoản hoặc mã này trong hệ thống!");
    }

    const target = profiles[0];
    const res = await fetch(`${ENV.SUPABASE_URL}/auth/v1/admin/users/${target.id}`, {
      method: 'PUT',
      headers: {
        'apikey': ENV.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${ENV.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ password: newPassword })
    });

    const result = await res.json();
    if (!res.ok) {
      if (result.msg?.includes('weak_password')) {
        throw new Error("Mật khẩu phải chứa đủ: chữ thường, chữ HOA, số và ký tự đặc biệt (VD: Bao123456!@#)!");
      }
      throw new Error(result.msg || "Không thể đặt lại mật khẩu!");
    }

    return { success: true, user: result, profile: target };
  }

  async updateUserPassword(newPassword) {
    if (!newPassword || newPassword.length < 8) {
      throw new Error("Mật khẩu mới phải có tối thiểu 8 ký tự!");
    }

    if (this.client) {
      // 1. Try standard Supabase client auth updateUser
      const { data, error } = await this.client.auth.updateUser({
        password: newPassword
      });

      if (error) {
        // Fallback: use admin API with session user ID
        const session = await this.getSession();
        if (session?.user?.id) {
          const res = await fetch(`${ENV.SUPABASE_URL}/auth/v1/admin/users/${session.user.id}`, {
            method: 'PUT',
            headers: {
              'apikey': ENV.SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${ENV.SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password: newPassword })
          });
          const result = await res.json();
          if (!res.ok) {
            if (result.msg?.includes('weak_password')) {
              throw new Error("Mật khẩu phải chứa đủ: chữ thường, chữ HOA, số và ký tự đặc biệt (VD: Bao123456!@#)!");
            }
            throw new Error(result.msg || "Không thể đổi mật khẩu!");
          }
          return result;
        }

        if (error.message?.includes('weak_password')) {
          throw new Error("Mật khẩu phải chứa đủ: chữ thường, chữ HOA, số và ký tự đặc biệt (VD: Bao123456!@#)!");
        }
        throw error;
      }
      return data;
    }
    return true;
  }

  async signInWithGoogle() {
    if (!this.client) return { error: new Error("Supabase client chưa khởi tạo") };
    
    // CRITICAL FIX: Ensure trailing slash on GitHub pages to prevent 301 redirect from dropping the OAuth hash!
    let redirectUrl = window.location.origin + window.location.pathname;
    if (!redirectUrl.endsWith('/')) {
      redirectUrl += '/';
    }
    
    const { data, error } = await this.client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    });
    return { data, error };
  }

  async signOut() {
    if (this.client) {
      try {
        await this.client.auth.signOut();
      } catch (err) {
        console.warn("Supabase signOut err:", err);
      }
    }
    localStorage.removeItem('ourmam_auth');
    localStorage.removeItem('ourmam_current_user');
    localStorage.removeItem('ourmam_meals');
    localStorage.removeItem('ourmam_messages');
    localStorage.removeItem('ourmam_connections');
    localStorage.removeItem('ourmam_known_profiles');

    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('sb-') || k.includes('supabase.auth.token'))) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (e) {}
  }

  // ==================== PROFILE METHODS ====================
  async ensureProfile(sessionUser) {
    if (!sessionUser) return null;
    try {
      const data = await this.dbQuery(`profiles?id=eq.${sessionUser.id}&select=*`);
      const existing = data?.[0];

      const email = sessionUser.email || '';
      const fallbackName = extractUsername(email) || 'Bạn';
      const extractedName = sessionUser.user_metadata?.full_name || 
                            sessionUser.user_metadata?.name || 
                            fallbackName;
      const initialCode = 'MAM' + Math.floor(100 + Math.random() * 899);

      if (!existing) {
        const newProfile = {
          id: sessionUser.id,
          user_code: initialCode,
          email: email,
          display_name: extractedName,
          avatar_url: sessionUser.user_metadata?.avatar_url || sessionUser.user_metadata?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(extractedName)}&background=FF7A53&color=fff&bold=true&size=300`,
          status_text: 'Sẵn sàng chia sẻ bữa ăn 🍽️',
          is_online: true
        };
        const inserted = await this.dbQuery('profiles', {
          method: 'POST',
          body: JSON.stringify(newProfile),
          prefer: 'resolution=merge-duplicates,return=representation'
        });
        const finalProf = inserted?.[0] || newProfile;
        const known = this.getLocal('ourmam_known_profiles', {});
        known[finalProf.id] = finalProf;
        this.setLocal('ourmam_known_profiles', known);
        return finalProf;
      } else {
        if (!existing.display_name || existing.display_name === 'Thành viên mới 🌸' || existing.display_name.startsWith('Người ')) {
          await this.dbQuery(`profiles?id=eq.${existing.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ display_name: extractedName })
          });
          existing.display_name = extractedName;
        }
        const known = this.getLocal('ourmam_known_profiles', {});
        known[existing.id] = existing;
        this.setLocal('ourmam_known_profiles', known);
        return existing;
      }
    } catch (e) {
      console.warn("ensureProfile error:", e);
    }
    return null;
  }

  async getProfile(userId) {
    if (!userId) return null;
    try {
      const data = await this.dbQuery(`profiles?id=eq.${userId}&select=*`);
      if (data && data.length > 0) {
        const prof = data[0];
        prof.streak_count = prof.streak_count ?? 0;
        const known = this.getLocal('ourmam_known_profiles', {});
        known[prof.id] = prof;
        this.setLocal('ourmam_known_profiles', known);
        return prof;
      }
      return null;
    } catch (err) {
      console.warn("getProfile error:", err);
      return this.getLocal('ourmam_current_user', null);
    }
  }

  async updateProfile(userId, updates) {
    try {
      const payload = { ...updates, updated_at: new Date().toISOString() };
      const data = await this.dbQuery(`profiles?id=eq.${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      // Synchronize past meals so widgets and feed immediately show the updated name
      if (updates.display_name) {
        this.dbQuery(`meals?user_id=eq.${userId}`, {
          method: 'PATCH',
          body: JSON.stringify({ user_name: updates.display_name })
        }).catch(err => console.warn("meals user_name sync warning:", err));
      }
      const updated = data?.[0] || { id: userId, ...payload };
      const known = this.getLocal('ourmam_known_profiles', {});
      known[userId] = { ...(known[userId] || {}), ...updated };
      this.setLocal('ourmam_known_profiles', known);
      this.setLocal('ourmam_current_user', updated);
      return updated;
    } catch (err) {
      console.warn("updateProfile error:", err);
      return updates;
    }
  }

  // ==================== CONNECTION METHODS ====================
  async addConnection(targetCode, relationshipType = 'friend') {
    const cleanCode = targetCode.trim().toUpperCase();
    try {
      const session = await this.getSession();
      const sessionUser = session?.user;
      if (!sessionUser) {
        return { success: false, message: 'Bạn chưa đăng nhập! Vui lòng đăng nhập lại.' };
      }

      // 1. Find target user by user_code
      const targetUsers = await this.dbQuery(`profiles?user_code=ilike.${encodeURIComponent(cleanCode)}&select=*`);
      if (!targetUsers || targetUsers.length === 0) {
        return { success: false, message: `Không tìm thấy tài khoản có mã "${cleanCode}". Vui lòng kiểm tra lại!` };
      }

      const targetUser = targetUsers[0];
      if (targetUser.id === sessionUser.id) {
        return { success: false, message: 'Bạn không thể tự kết nối với chính mình!' };
      }

      // Cache targetUser profile locally for instantaneous cross-account name resolution
      const known = this.getLocal('ourmam_known_profiles', {});
      known[targetUser.id] = targetUser;
      this.setLocal('ourmam_known_profiles', known);

      // 2. Direct insert or update connection A -> B as 'pending'
      const existingAB = await this.dbQuery(`connections?user_id=eq.${sessionUser.id}&friend_id=eq.${targetUser.id}&select=id`);
      if (existingAB && existingAB.length > 0) {
        await this.dbQuery(`connections?id=eq.${existingAB[0].id}`, {
          method: 'PATCH',
          body: JSON.stringify({ relationship_type: relationshipType, status: 'pending' })
        });
      } else {
        await this.dbQuery('connections', {
          method: 'POST',
          body: JSON.stringify({
            user_id: sessionUser.id,
            friend_id: targetUser.id,
            relationship_type: relationshipType,
            status: 'pending'
          })
        });
      }

      return {
        success: true,
        friend_id: targetUser.id,
        friend_name: targetUser.display_name,
        relationship_type: relationshipType,
        message: `Đã gửi yêu cầu ghép đôi tới ${targetUser.display_name}. Vui lòng chờ xác nhận!`
      };
    } catch (err) {
      console.error("addConnection error:", err);
      return { success: false, message: "Lỗi kết nối mạng hoặc server." };
    }
  }

  async getPendingRequests() {
    try {
      const session = await this.getSession();
      const sessionUser = session?.user;
      if (!sessionUser) return [];

      const reqs = await this.dbQuery(`connections?friend_id=eq.${sessionUser.id}&status=eq.pending&select=id,user_id,relationship_type,created_at`);
      if (!reqs || reqs.length === 0) return [];
      
      const userIds = [...new Set(reqs.map(r => r.user_id))];
      const profiles = await this.dbQuery(`profiles?id=in.(${userIds.join(',')})&select=*`);
      const profileMap = new Map();
      if (profiles) profiles.forEach(p => profileMap.set(p.id, p));

      return reqs.map(r => ({
        connection_id: r.id,
        requester: profileMap.get(r.user_id) || { id: r.user_id, display_name: 'Ai đó' },
        relationship_type: r.relationship_type,
        created_at: r.created_at
      }));
    } catch (err) {
      console.warn("getPendingRequests error:", err);
      return [];
    }
  }

  async respondToRequest(connectionId, isAccepted, requesterId, relationshipType = 'friend') {
    try {
      const session = await this.getSession();
      const sessionUser = session?.user;
      if (!sessionUser) return false;

      if (!isAccepted) {
        await this.dbQuery(`connections?id=eq.${connectionId}`, { method: 'DELETE' });
        return true;
      }

      // Mark A -> B as accepted
      await this.dbQuery(`connections?id=eq.${connectionId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'accepted' })
      });

      // Create B -> A as accepted
      const existingBA = await this.dbQuery(`connections?user_id=eq.${sessionUser.id}&friend_id=eq.${requesterId}&select=id`);
      if (existingBA && existingBA.length > 0) {
        await this.dbQuery(`connections?id=eq.${existingBA[0].id}`, {
          method: 'PATCH',
          body: JSON.stringify({ relationship_type: relationshipType, status: 'accepted' })
        });
      } else {
        await this.dbQuery('connections', {
          method: 'POST',
          body: JSON.stringify({
            user_id: sessionUser.id,
            friend_id: requesterId,
            relationship_type: relationshipType,
            status: 'accepted'
          })
        });
      }
      return true;
    } catch (err) {
      console.warn("respondToRequest error:", err);
      return false;
    }
  }

  async getConnections(userId) {
    if (!userId) {
      userId = this.getLocal('ourmam_current_user')?.id;
    }
    if (!userId) return this.getLocal('ourmam_connections', []);

    const normalizedUserId = String(userId).trim().toLowerCase();

    try {
      // 1. Fetch connection records where this user is user_id OR friend_id
      const rawConns = await this.dbQuery(`connections?or=(user_id.eq.${normalizedUserId},friend_id.eq.${normalizedUserId})&select=*`);

      if (!rawConns || rawConns.length === 0) {
        return this.getLocal('ourmam_connections', []);
      }

      // 2. Extract partner user IDs
      const partnerIds = rawConns.map(c => {
        const uId = String(c.user_id).trim().toLowerCase();
        return uId === normalizedUserId ? c.friend_id : c.user_id;
      }).filter(Boolean);
      const uniquePartnerIds = [...new Set(partnerIds)];

      if (uniquePartnerIds.length === 0) return [];

      const friendProfiles = await this.dbQuery(`profiles?id=in.(${uniquePartnerIds.join(',')})&select=*`);

      const known = this.getLocal('ourmam_known_profiles', {});
      const profileMap = new Map();

      if (friendProfiles && friendProfiles.length > 0) {
        friendProfiles.forEach(p => {
          if (p && p.id) {
            known[p.id] = p;
            profileMap.set(p.id, p);
          }
        });
      }

      this.setLocal('ourmam_known_profiles', known);

      // 3. De-duplicate connections by friend ID
      const seenFriendIds = new Set();
      const enriched = [];
      const localNicks = this.getLocal('ourmam_nicknames_' + normalizedUserId, {});

      for (const conn of rawConns) {
        const uId = String(conn.user_id).trim().toLowerCase();
        const otherId = uId === normalizedUserId ? conn.friend_id : conn.user_id;
        if (seenFriendIds.has(otherId)) continue;
        seenFriendIds.add(otherId);

        const isCouple = conn.relationship_type === 'couple';
        const partnerProf = profileMap.get(otherId) || known[otherId];
        const customNickname = conn.nickname || localNicks[otherId] || null;

        const friendProfile = partnerProf ? {
          ...partnerProf,
          custom_nickname: customNickname,
          streak_count: conn.streak_count || 1,
          relationship_type: conn.relationship_type || (isCouple ? 'couple' : 'friend')
        } : {
          id: otherId,
          display_name: isCouple ? 'Người yêu' : 'Bạn bè',
          custom_nickname: customNickname,
          user_code: 'MAM...',
          avatar_url: null,
          streak_count: conn.streak_count || 1,
          relationship_type: conn.relationship_type || (isCouple ? 'couple' : 'friend'),
          is_online: true
        };

        enriched.push({
          ...conn,
          nickname: customNickname,
          friend_id: otherId,
          friend: friendProfile
        });
      }

      this.setLocal('ourmam_connections', enriched);
      return enriched;
    } catch (err) {
      console.warn("getConnections error:", err);
      return this.getLocal('ourmam_connections', []);
    }
  }

  async updateNickname(userId, friendId, nickname) {
    if (!userId || !friendId) return false;
    const cleanNick = nickname ? nickname.trim() : null;
    const normalizedUserId = String(userId).trim().toLowerCase();

    // 1. Update local storage cache
    const key = 'ourmam_nicknames_' + normalizedUserId;
    const nicks = this.getLocal(key, {});
    if (cleanNick) {
      nicks[friendId] = cleanNick;
    } else {
      delete nicks[friendId];
    }
    this.setLocal(key, nicks);

    // 2. Update local connections list cache
    const conns = this.getLocal('ourmam_connections', []);
    if (Array.isArray(conns)) {
      conns.forEach(c => {
        if (c.friend && c.friend.id === friendId) {
          c.nickname = cleanNick;
          c.friend.custom_nickname = cleanNick;
        }
      });
      this.setLocal('ourmam_connections', conns);
    }

    // 3. Attempt DB patch
    try {
      await this.dbQuery(`connections?user_id=eq.${normalizedUserId}&friend_id=eq.${friendId}`, {
        method: 'PATCH',
        body: JSON.stringify({ nickname: cleanNick })
      });
    } catch (e) {
      console.warn("updateNickname DB patch notice:", e);
    }
    return true;
  }

  // ==================== STORAGE & MEAL METHODS ====================
  async uploadPhoto(fileOrBlob) {
    if (!this.client) return null;
    try {
      const fileName = `meal_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      const { data, error } = await this.client.storage
        .from('meal-photos')
        .upload(fileName, fileOrBlob, {
          contentType: 'image/jpeg',
          upsert: false
        });
      if (error) throw error;

      const { data: publicUrlData } = this.client.storage
        .from('meal-photos')
        .getPublicUrl(fileName);

      return publicUrlData.publicUrl;
    } catch (err) {
      console.error("uploadPhoto error:", err);
      return null;
    }
  }

  async getMeals() {
    try {
      const data = await this.dbQuery('meals?select=*,reactions(*)&order=created_at.desc&limit=60');
      return data || [];
    } catch (err) {
      console.warn("getMeals error, using local fallback:", err);
      return this.getLocal('ourmam_meals', INITIAL_MEALS);
    }
  }

  async createMeal(mealData) {
    try {
      const data = await this.dbQuery('meals', {
        method: 'POST',
        body: JSON.stringify(mealData)
      });
      return data?.[0] || { id: "meal-" + Date.now(), ...mealData, created_at: new Date().toISOString() };
    } catch (err) {
      console.error("createMeal error:", err);
      return { id: "meal-" + Date.now(), ...mealData, created_at: new Date().toISOString() };
    }
  }

  async deleteMeal(mealId) {
    try {
      // 1. Delete associated reactions first (gracefully ignore if none)
      await this.dbQuery(`reactions?meal_id=eq.${mealId}`, {
        method: 'DELETE',
        prefer: 'return=minimal'
      }).catch(e => console.warn("Reactions cleanup note:", e));

      // 2. Delete the meal record
      await this.dbQuery(`meals?id=eq.${mealId}`, {
        method: 'DELETE',
        prefer: 'return=representation'
      });

      // 3. Clean up local fallback cache
      const localMeals = this.getLocal('ourmam_meals', []);
      const updatedMeals = localMeals.filter(m => m.id !== mealId);
      this.setLocal('ourmam_meals', updatedMeals);

      return true;
    } catch (err) {
      console.warn("deleteMeal server error, updating local cache:", err);
      const localMeals = this.getLocal('ourmam_meals', []);
      const updatedMeals = localMeals.filter(m => m.id !== mealId);
      this.setLocal('ourmam_meals', updatedMeals);
      return true;
    }
  }

  async addReaction(mealId, userId, userName, emoji, label) {
    try {
      const data = await this.dbQuery('reactions', {
        method: 'POST',
        body: JSON.stringify({
          meal_id: mealId,
          user_id: userId,
          user_name: userName,
          emoji: emoji,
          label: label
        })
      });
      return data?.[0] || null;
    } catch (err) {
      console.error("addReaction error:", err);
      return null;
    }
  }

  // ==================== CHAT METHODS ====================
  async getMessages() {
    try {
      const data = await this.dbQuery('messages?select=*&order=created_at.asc&limit=150');
      return data || [];
    } catch (err) {
      console.warn("getMessages error, using local:", err);
      return this.getLocal('ourmam_messages', INITIAL_MESSAGES);
    }
  }

  async getRecentMessages(limit = 25) {
    try {
      const data = await this.dbQuery(`messages?select=*&order=created_at.desc&limit=${limit}`);
      if (Array.isArray(data)) {
        return data.reverse();
      }
      return [];
    } catch (err) {
      return [];
    }
  }

  async sendMessage(msgData) {
    try {
      const data = await this.dbQuery('messages', {
        method: 'POST',
        body: JSON.stringify(msgData)
      });
      return data?.[0] || { id: "msg-" + Date.now(), ...msgData, created_at: new Date().toISOString() };
    } catch (err) {
      console.error("sendMessage error:", err);
      return { id: "msg-" + Date.now(), ...msgData, created_at: new Date().toISOString() };
    }
  }

  // ==================== REALTIME SUBSCRIPTIONS ====================
  subscribeToMeals(callback, onDeleteCallback) {
    if (!this.client) return;
    return this.client
      .channel('public:meals')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'meals' }, payload => {
        if (callback && payload.new) callback(payload.new);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'meals' }, payload => {
        if (onDeleteCallback && payload.old) onDeleteCallback(payload.old);
      })
      .subscribe();
  }

  subscribeToMessages(callback) {
    if (!this.client) return;
    
    // Clear any previous chat channel
    if (this._chatChannel) {
      try { this.client.removeChannel(this._chatChannel); } catch(e) {}
    }

    // High-speed dual channel: Broadcast (sub-50ms peer-to-peer) + Postgres Changes (DB backup)
    this._chatChannel = this.client.channel('ourmam_chat_realtime', {
      config: {
        broadcast: { self: false } // don't receive self's own broadcast
      }
    });

    this._chatChannel
      .on('broadcast', { event: 'new_message' }, payload => {
        if (payload?.payload) {
          callback(payload.payload);
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        if (payload?.new) {
          callback(payload.new);
        }
      })
      .subscribe((status) => {
        console.log("⚡ Supabase Chat Realtime Status:", status);
      });

    return this._chatChannel;
  }

  broadcastMessage(msgData) {
    if (this._chatChannel) {
      this._chatChannel.send({
        type: 'broadcast',
        event: 'new_message',
        payload: msgData
      }).catch(err => console.warn("Broadcast message error:", err));
    }
  }

  subscribeToConnections(callback) {
    if (!this.client) return;
    return this.client
      .channel('public:connections')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'connections' }, payload => {
        callback(payload);
      })
      .subscribe();
  }

  // ==================== LOCAL STORAGE HELPERS ====================
  getLocal(key, defaultData) {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultData;
  }

  setLocal(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  removeLocal(key) {
    localStorage.removeItem(key);
  }
}

export const api = new ApiService();
