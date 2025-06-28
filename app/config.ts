export const API_BASE_URL = 'https://2d89-187-255-43-93.ngrok-free.app';

export const API_ENDPOINTS = {
  mainSentiments: {
    summary: `${API_BASE_URL}/main-sentiments/summary`,
    detail: (id: number | string) => `${API_BASE_URL}/main-sentiments/${id}`,
  },
  movies: {
    detail: (id: number | string) => `${API_BASE_URL}/movies/${id}`,
  },
  emotionalIntentions: {
    list: (sentimentId: number | string) => `${API_BASE_URL}/api/emotional-intentions/${sentimentId}`,
  },
  personalizedJourney: {
    get: (sentimentId: number | string, intentionId: number | string) => 
      `${API_BASE_URL}/api/personalized-journey/${sentimentId}/${intentionId}`,
  },
}; 