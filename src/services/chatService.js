/**
 * ==============================================================================
 * CHAT SERVICE
 * Handles Messages, Meal Alerts & Couple Love Notes
 * ==============================================================================
 */

import { api } from './api.js?v=2026092401';
import { INITIAL_MESSAGES } from '../constants/mockData.js';

const CHAT_KEY = 'ourmam_messages';

class ChatService {
  async getMessages() {
    const data = await api.getMessages();
    if (data && data.length > 0) {
      api.setLocal(CHAT_KEY, data);
      return data;
    }
    return api.getLocal(CHAT_KEY, INITIAL_MESSAGES);
  }

  async getRecentMessages(limit = 25) {
    return await api.getRecentMessages(limit);
  }

  broadcast(messagePayload) {
    api.broadcastMessage(messagePayload);
  }

  async sendMessage(messagePayload) {
    // 1. Broadcast immediately for instant sub-50ms peer receipt over active websocket
    api.broadcastMessage(messagePayload);
    // 2. Persist to Supabase Database
    const created = await api.sendMessage(messagePayload);
    return created;
  }
}

export const chatService = new ChatService();
