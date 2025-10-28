export interface EmotionalIntention {
  id: number;
  type: 'PROCESS' | 'TRANSFORM' | 'MAINTAIN' | 'EXPLORE';
  description: string;
  preferredGenres: string[];
  avoidGenres: string[];
  emotionalTone: string;
}

export interface EmotionalIntentionsResponse {
  sentimentId: number;
  sentimentName: string;
  intentions: EmotionalIntention[];
}

export interface Sentiment {
  id: number;
  name: string;
  description: string;
  keywords: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface MovieStreamingPlatform {
  streamingPlatformId: number;
  accessType: 'INCLUDED_WITH_SUBSCRIPTION' | 'RENTAL' | 'PURCHASE';
  streamingPlatform: {
    id: number;
    name: string;
    category: 'SUBSCRIPTION_PRIMARY' | 'HYBRID' | 'RENTAL_PURCHASE_PRIMARY' | 'FREE_PRIMARY';
    logoPath: string | null;
  };
}

export interface Movie {
  id: string;
  title: string;
  thumbnail?: string;
  year?: number;
  director?: string;
  vote_average?: number;
  certification?: string;
  genres?: string[];
  runtime?: number;
  platforms?: MovieStreamingPlatform[];
  imdbRating?: number;
  imdb_rating?: number;
}

export interface MovieSuggestion {
  reason: string;
  movie: Movie;
}

export interface JourneyOption {
  id: number;
  text: string;
  nextStepId: string | null;
  isEndState: boolean;
  movieSuggestions?: MovieSuggestion[];
}



export interface PersonalizedJourneyStep {
  id: number;
  stepId: string;
  order: number;
  question: string;
  priority?: number;
  contextualHint?: string;
  isRequired?: boolean;
  options: JourneyOption[];
}

export interface PersonalizedJourneyResponse {
  id: number;
  mainSentimentId: number;
  emotionalIntentionId: number;
  steps: PersonalizedJourneyStep[];
}

export interface StreamingPlatform {
  id: number;
  name: string;
  category: 'SUBSCRIPTION_PRIMARY' | 'HYBRID' | 'RENTAL_PURCHASE_PRIMARY' | 'FREE_PRIMARY';
  showFilter: 'PRIORITY' | 'SECONDARY' | 'HIDDEN';
  logoPath: string | null;
  baseUrl: string | null;
  hasFreeTrial: boolean;
  freeTrialDuration: string | null;
} 