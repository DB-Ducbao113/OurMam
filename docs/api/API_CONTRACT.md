# ==============================================================================
# OURMAM - API CONTRACT & DATA SPECIFICATION (V1)
# ==============================================================================

This document defines the strict data schemas and communication contract between the **Frontend Application** and the **Backend Data Layer**.

---

## 1. Domain Entities

### A. Meal Entity (`meals`)
Represents a culinary moment captured and shared with the partner or circle.

```typescript
interface Meal {
  id: string;               // Primary Key (UUIDv4)
  user_id: string;          // Foreign Key -> profiles.id
  user_name: string;        // Display name at time of posting (e.g. "Alex 🌸")
  user_avatar: string;      // Public URL to author's avatar image
  photo_url: string;        // Public URL or optimized Base64 data string (<150KB)
  dish_name: string;        // Name of the dish (e.g. "Bún Bò Huế")
  caption: string;          // Narrative / note (e.g. "Trưa nay ăn bún bò ngon xỉu 🍜")
  meal_type: MealType;      // Categorical classification
  location: string;         // City / Neighborhood metadata (e.g. "Q.1, Sài Gòn")
  calories: string;         // Caloric approximation (e.g. "~560 kcal")
  rating: number;           // Quality rating scale (1 - 5)
  created_at: string;       // ISO 8601 UTC Timestamp (e.g. "2026-09-15T12:30:00.000Z")
}

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
```

### B. Profile Entity (`profiles`)
Represents an authorized user participating in the shared meal sphere.

```typescript
interface Profile {
  id: string;               // Primary Key (UUIDv4)
  user_code: string;        // Personal invite code (e.g. "MAM852")
  display_name: string;     // Friendly display name (e.g. "Alex 🌸")
  role: 'couple' | 'friend' | 'family'; // Group relationship role
  avatar_url: string;       // Public URL to profile avatar
  streak_count: number;     // Consecutive daily meal sharing count
  status_text: string;      // Real-time domestic hunger/activity status
  is_online?: boolean;      // Ephemeral presence flag
  last_active?: string;     // ISO 8601 UTC Timestamp
}
```

### C. Message Entity (`messages`)
Represents direct communication and culinary alerts exchanged in the chat tab.

```typescript
interface Message {
  id: string;               // Primary Key (UUIDv4)
  user_id: string;          // Foreign Key -> profiles.id
  user_name: string;        // Display name of sender
  user_avatar: string;      // Avatar URL
  text: string;             // Text body
  photo_url?: string | null;// Attached food photo (if any)
  meal_tag?: string | null; // Associated meal category tag
  created_at: string;       // ISO 8601 UTC Timestamp
}
```

### D. Reaction Entity (`reactions`)
Represents an emotional response attached to a specific meal.

```typescript
interface Reaction {
  id: string;               // Primary Key (UUIDv4)
  meal_id: string;          // Foreign Key -> meals.id
  user_id: string;          // Foreign Key -> profiles.id
  user_name: string;        // Name of user who reacted
  emoji: string;            // Emoji character (e.g. "💕", "🤤", "👏", "🧋")
  label: string;            // Descriptive tag (e.g. "Yêu quá", "Thèm xỉu")
  created_at: string;       // ISO 8601 UTC Timestamp
}
```

---

## 2. API Operations Matrix

| Method | Resource | Purpose | Request Payload | Response Schema |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/rest/v1/meals` | Fetch recent meal feed | `?order=created_at.desc&limit=50` | `Meal[]` |
| `POST` | `/rest/v1/meals` | Publish newly snapped meal | `Omit<Meal, 'id' \| 'created_at'>` | `Meal` |
| `DELETE` | `/rest/v1/meals` | Delete a meal post | `?id=eq.{id}` | `void` |
| `GET` | `/rest/v1/profiles`| Fetch circle member list | None | `Profile[]` |
| `POST` | `/rest/v1/profiles`| Register a new member | `Omit<Profile, 'id'>` | `Profile` |
| `GET` | `/rest/v1/messages`| Fetch chat log | `?order=created_at.asc&limit=50` | `Message[]` |
| `POST` | `/rest/v1/messages`| Post a message/polaroid | `Omit<Message, 'id' \| 'created_at'>` | `Message` |
| `POST` | `/rest/v1/reactions`| Send a reaction | `Omit<Reaction, 'id' \| 'created_at'>` | `Reaction` |

---

## 3. Storage Retention Rule (Backend Requirement)

All records with `created_at < NOW() - INTERVAL '180 days'` (6 months) are automatically purged via PostgreSQL trigger or cron to guarantee zero-cost lifetime operation within the free tier.
