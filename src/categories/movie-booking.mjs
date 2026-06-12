/**
 * Memact Context - Movie Booking Category
 *
 * Important rule: Activity is not identity.
 * A single booking, search, or cancellation does NOT define long-term preferences.
 */

export const SENSITIVE_FIELDS = new Set([
  "payment_method",
  "personal_id",
  "phone_number"
]);

export const DURABLE_PREFERENCES = new Set([
  "preferred_genres",
  "language_preference",
  "seat_preference",
  "theatre_preference",
  "watching_frequency"
]);

export function normalizeMovieBookingContext(input) {
  if (!input || !input.data) return null;

  const { source, type, data, explicit = false } = input;

  // 1. Safety check (do not infer sensitive info)
  const hasSensitive = Object.keys(data).some(key =>
    SENSITIVE_FIELDS.has(key)
  );

  if (hasSensitive && !explicit) {
    return {
      category: "movie-booking",
      source,
      status: "rejected",
      reason:
        "Sensitive booking data requires explicit user consent."
    };
  }

  // 2. Activity handling (weak signal only)
  if (type === "activity") {
    const summary =
      `Interacted with movie booking system` +
      (data.movie ? ` for ${data.movie}` : "");

    return {
      category: "movie-booking",
      source,
      observation_type: "weak_observation",
      confidence: "low",
      is_identity_claim: false,
      observation: summary,
      suggestion: generateUserReadableSuggestion(type, data),
      needs_review: true
    };
  }

  // 3. Preference handling
  if (type === "preference") {
    const preferences = {};

    for (const [k, v] of Object.entries(data)) {
      if (
        DURABLE_PREFERENCES.has(k) ||
        SENSITIVE_FIELDS.has(k)
      ) {
        preferences[k] = v;
      }
    }

    return {
      category: "movie-booking",
      source,
      observation_type: explicit
        ? "explicit_preference"
        : "inferred_preference",
      confidence: explicit ? "high" : "medium",
      is_identity_claim: explicit,
      preferences,
      suggestion: explicit
        ? null
        : generateUserReadableSuggestion("preference", data),
      needs_review: !explicit
    };
  }

  return {
    category: "movie-booking",
    source,
    observation_type: "unknown",
    confidence: "low"
  };
}

export function generateUserReadableSuggestion(type, data) {
  if (type === "activity" && data.genre) {
    return `You recently watched or searched ${data.genre} movies. Save '${data.genre}' as a preference?`;
  }

  if (type === "activity" && data.movie) {
    return `You interacted with "${data.movie}". Would you like similar recommendations?`;
  }

  if (type === "preference" && data.language_preference) {
    return `Set your preferred movie language to '${data.language_preference}'?`;
  }

  return "Would you like to update your movie preferences based on recent activity?";
}

export const MOVIE_BOOKING_EXAMPLES = {
  rawAppInputs: {
    one_off_booking: {
      source: "CinemaApp",
      type: "activity",
      explicit: false,
      data: {
        movie: "Interstellar",
        genre: "Sci-Fi",
        seat_type: "recliner"
      }
    },

    explicit_preferences: {
      source: "CinemaApp",
      type: "preference",
      explicit: true,
      data: {
        preferred_genres: "Action",
        language_preference: "English",
        seat_preference: "recliner"
      }
    }
  },

  normalizedOutputs: {
    one_off_result: {
      category: "movie-booking",
      observation_type: "weak_observation",
      confidence: "low",
      is_identity_claim: false,
      observation: "Interacted with movie booking system for Interstellar",
      suggestion:
        "You recently watched or searched Sci-Fi movies. Save 'Sci-Fi' as a preference?",
      needs_review: true
    }
  }
};