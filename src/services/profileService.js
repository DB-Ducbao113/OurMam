/**
 * ==============================================================================
 * PROFILE & CIRCLE SERVICE
 * Handles User Profile, User Code, and Adding Friends / Couple Connection
 * ==============================================================================
 */

import { api } from './api.js?v=2026092302';
import { INITIAL_PROFILES } from '../constants/mockData.js';

const ACTIVE_USER_KEY = 'ourmam_current_user';

class ProfileService {
  getCurrentUser() {
    return api.getLocal(ACTIVE_USER_KEY, null);
  }

  setCurrentUser(profile) {
    api.setLocal(ACTIVE_USER_KEY, profile);
    return profile;
  }

  async fetchProfile(userId) {
    const profile = await api.getProfile(userId);
    if (profile) {
      this.setCurrentUser(profile);
      return profile;
    } else {
      this.clearCurrentUser();
      return null;
    }
  }

  async ensureProfile(sessionUser) {
    const profile = await api.ensureProfile(sessionUser);
    if (profile) {
      this.setCurrentUser(profile);
      return profile;
    }
    return null;
  }

  clearCurrentUser() {
    api.removeLocal(ACTIVE_USER_KEY);
  }

  async getConnections(userId) {
    return await api.getConnections(userId);
  }

  async addConnection(targetCode, relationshipType = 'friend') {
    return await api.addConnection(targetCode, relationshipType);
  }

  async removeCoupleConnection(partnerId) {
    return await api.removeCoupleConnection(partnerId);
  }

  async updateStatus(userId, statusText) {
    const updated = await api.updateProfile(userId, { status_text: statusText });
    if (updated) this.setCurrentUser(updated);
    return updated;
  }

  async updateDisplayName(userId, name) {
    const updated = await api.updateProfile(userId, { display_name: name });
    if (updated) this.setCurrentUser(updated);
    return updated;
  }

  async updateAvatar(userId, avatarUrl) {
    const updated = await api.updateProfile(userId, { avatar_url: avatarUrl });
    if (updated) this.setCurrentUser(updated);
    return updated;
  }

  async updateNickname(userId, friendId, nickname) {
    return await api.updateNickname(userId, friendId, nickname);
  }
}

export const profileService = new ProfileService();
