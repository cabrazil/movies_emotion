// Configuração automática de ambiente baseada na versão web
const getApiBaseUrl = () => {
  // Prioridade: variável de ambiente > detecção automática > fallback
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }
  
  // Detecção automática baseada no ambienter
  
  if (__DEV__) {
    // Desenvolvimento: usar mesmo backend local que o frontend
    return 'https://c3da75ce6779.ngrok-free.app';
  }
  
  // Produção: usar Vercel
  return 'https://moviesf-back.vercel.app';
};

export const API_BASE_URL = getApiBaseUrl();

// Log da URL base para debug
console.log('🌐 API Base URL:', API_BASE_URL);
console.log('🔧 Environment:', __DEV__ ? 'development' : 'production');

// Helper para fazer requisições com headers corretos e retry
export const apiRequest = async (url: string, options: RequestInit = {}, retries = 3): Promise<Response> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  // Adicionar header ngrok se necessário
  if (API_BASE_URL.includes('ngrok')) {
    headers['ngrok-skip-browser-warning'] = 'true';
  }

  try {
    // Adicionar timeout de 30 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    // Se erro 500 e ainda há tentativas, tentar novamente
    if (!response.ok && response.status >= 500 && retries > 0) {
      const delay = Math.pow(2, 3 - retries) * 1000; // Backoff exponencial: 1s, 2s, 4s
      console.log(`🔄 Tentativa ${4 - retries} falhou (${response.status}), tentando novamente em ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return apiRequest(url, options, retries - 1);
    }

    return response;
  } catch (error) {
    if (retries > 0) {
      const delay = Math.pow(2, 3 - retries) * 1000;
      console.log(`🔄 Erro de rede: ${error instanceof Error ? error.message : 'Erro desconhecido'}, tentando novamente em ${delay}ms... (${retries} tentativas restantes)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return apiRequest(url, options, retries - 1);
    }
    console.error(`❌ Falha final após todas as tentativas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    throw error;
  }
};

export const API_ENDPOINTS = {
  mainSentiments: {
    summary: `${API_BASE_URL}/main-sentiments/summary`,
    detail: (id: number | string) => `${API_BASE_URL}/main-sentiments/${id}`,
  },
  movies: {
    detail: (id: number | string) => `${API_BASE_URL}/api/movie/${id}/details`,
  },
  emotionalIntentions: {
    list: (sentimentId: number | string) => `${API_BASE_URL}/api/emotional-intentions/${sentimentId}`,
  },
  personalizedJourney: {
    get: (sentimentId: number | string, intentionId: number | string) => 
      `${API_BASE_URL}/api/personalized-journey/${sentimentId}/${intentionId}`,
  },
  streamingPlatforms: {
    list: `${API_BASE_URL}/api/streaming-platforms`,
  },
}; 