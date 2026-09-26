/**
 * ==============================================================================
 * MEAL SERVICE
 * Handles Meal CRUD, Supabase Storage uploads, and Reactions
 * ==============================================================================
 */

import { api } from './api.js';
import { INITIAL_MEALS } from '../constants/mockData.js';

const STORAGE_KEY = 'ourmam_meals';

class MealService {
  async getMeals() {
    const data = await api.getMeals();
    if (data && data.length > 0) {
      api.setLocal(STORAGE_KEY, data);
      return data;
    }
    return api.getLocal(STORAGE_KEY, INITIAL_MEALS);
  }

  async createMeal(mealPayload, photoBlob = null) {
    let finalPhotoUrl = mealPayload.photo_url;

    // If a Blob is provided, upload directly to Supabase Storage
    if (photoBlob) {
      try {
        const uploadedUrl = await api.uploadPhoto(photoBlob);
        if (uploadedUrl) {
          finalPhotoUrl = uploadedUrl;
        }
      } catch (err) {
        console.warn("Storage upload error, fallback to data URL:", err);
      }
    }

    const payload = {
      ...mealPayload,
      photo_url: finalPhotoUrl
    };

    const created = await api.createMeal(payload);
    return created;
  }

  async addReaction(mealId, userId, userName, emoji, label) {
    return await api.addReaction(mealId, userId, userName, emoji, label);
  }

  async deleteMeal(mealId) {
    return await api.deleteMeal(mealId);
  }

  async updateMealDetails(meal, details) {
    return await api.updateOwnMealDetails(meal, details);
  }
}

export const mealService = new MealService();
