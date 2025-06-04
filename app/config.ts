export const API_BASE_URL = 'https://c709-45-4-5-196.ngrok-free.app';

export const API_ENDPOINTS = {
  mainSentiments: {
    summary: `${API_BASE_URL}/main-sentiments/summary`,
    detail: (id: number | string) => `${API_BASE_URL}/main-sentiments/${id}`,
  },
  movies: {
    detail: (id: number | string) => `${API_BASE_URL}/movies/${id}`,
  },
}; 