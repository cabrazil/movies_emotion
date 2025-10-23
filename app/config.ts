// Configuração automática de ambiente baseada na versão web
const getApiBaseUrl = () => {
  // Prioridade: variável de ambiente > detecção automática > fallback
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }
  
  // Detecção automática baseada no ambiente
  if (__DEV__) {
    // Desenvolvimento: usar ngrok local
    return 'https://06654ae66bd6.ngrok-free.app';
  }
  
  // Produção: usar Vercel
  return 'https://moviesf-back.vercel.app';
};

export const API_BASE_URL = getApiBaseUrl();

// Log da URL base para debug
console.log('🌐 API Base URL:', API_BASE_URL);
console.log('🔧 Environment:', __DEV__ ? 'development' : 'production');

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