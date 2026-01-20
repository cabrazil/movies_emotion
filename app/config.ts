// Configuração automática de ambiente baseada no modo de desenvolvimento
// Suporta ambientes de desenvolvimento (localhost) e produção (VPS)
const getApiBaseUrl = () => {
  // Prioridade 1: variável de ambiente (mais alta prioridade)
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }

  // Prioridade 2: Detecção automática baseada no ambiente
  if (__DEV__) {
    // Desenvolvimento: usar backend local via Ngrok (Recomendado para evitar timeouts)
    // Rode 'ngrok http 3333' e cole a URL gerada abaixo
    return 'https://0c3b57e5fd2a.ngrok-free.app';
  }

  // Produção: usar URL de produção
  return 'https://api.vibesfilm.com';
};

export const API_BASE_URL = getApiBaseUrl();

// Log da URL base para debug (apenas em desenvolvimento e de forma assíncrona para não bloquear)
if (__DEV__) {
  // Usar setTimeout para não bloquear a inicialização
  setTimeout(() => {
    console.log('🌐 API Base URL:', API_BASE_URL);
  }, 0);
}

// Cache simples para requisições GET (apenas em memória)
const requestCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// Helper para fazer requisições com headers corretos e retry
export const apiRequest = async (url: string, options: RequestInit = {}, retries = 2): Promise<Response> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  // Adicionar header ngrok se necessário
  if (API_BASE_URL.includes('ngrok')) {
    headers['ngrok-skip-browser-warning'] = 'true';
  }

  // Verificar cache para requisições GET
  const isGetRequest = !options.method || options.method === 'GET';
  const cacheKey = `${url}_${JSON.stringify(options)}`;

  if (isGetRequest && requestCache.has(cacheKey)) {
    const cached = requestCache.get(cacheKey)!;
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      if (__DEV__) {
        console.log(`💾 Cache hit para: ${url}`);
      }
      // Retornar resposta simulada do cache
      return new Response(JSON.stringify(cached.data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      requestCache.delete(cacheKey);
    }
  }

  if (__DEV__) {
    console.log(`🌐 Fazendo requisição para: ${url}`);
  }

  // Timeout mais agressivo em desenvolvimento (tunnel adiciona latência)
  // Em dev: 10s, 20s | Em prod: 15s, 30s, 60s
  const timeoutDuration = __DEV__
    ? (retries === 2 ? 10000 : 20000)
    : (retries === 3 ? 15000 : retries === 2 ? 30000 : 60000);

  try {
    // Usar Promise.race para timeout (mais compatível com React Native)
    const fetchPromise = fetch(url, {
      ...options,
      headers,
      // Remover signal do AbortController que pode causar problemas no Expo Go
    });

    // Timeout usando Promise.race (mais compatível)
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Request timeout após ${timeoutDuration / 1000} segundos`));
      }, timeoutDuration);
    });

    const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;

    if (__DEV__) {
      console.log(`✅ Resposta recebida: ${response.status} ${response.statusText}`);
    }

    // Cachear respostas GET bem-sucedidas
    if (isGetRequest && response.ok) {
      try {
        const data = await response.clone().json();
        requestCache.set(cacheKey, { data, timestamp: Date.now() });
        // Limitar tamanho do cache (máximo 50 itens)
        if (requestCache.size > 50) {
          const firstKey = requestCache.keys().next().value;
          if (firstKey) {
            requestCache.delete(firstKey);
          }
        }
      } catch (e) {
        // Ignorar erros de parsing do cache
      }
    }

    // Se erro 500 e ainda há tentativas, tentar novamente
    if (!response.ok && response.status >= 500 && retries > 0) {
      const delay = __DEV__ ? 500 : Math.pow(2, 3 - retries) * 1000; // Backoff mais rápido em dev
      if (__DEV__) {
        console.log(`🔄 Tentativa ${3 - retries} falhou (${response.status}), tentando novamente em ${delay}ms...`);
      }
      await new Promise(resolve => setTimeout(resolve, delay));
      return apiRequest(url, options, retries - 1);
    }

    // Se erro de CORS (status 0 ou erro de rede), tentar novamente
    if (response.status === 0 && retries > 0) {
      const delay = __DEV__ ? 500 : Math.pow(2, 3 - retries) * 1000;
      if (__DEV__) {
        console.log(`🔄 Erro de CORS detectado, tentando novamente em ${delay}ms...`);
      }
      await new Promise(resolve => setTimeout(resolve, delay));
      return apiRequest(url, options, retries - 1);
    }

    return response;
  } catch (error) {
    // Se for timeout ou erro de rede e ainda há tentativas, tentar novamente
    const isTimeout = error instanceof Error && (error.message.includes('timeout') || error.message.includes('Timeout'));
    const isNetworkError = error instanceof Error && (
      error.message.includes('network') ||
      error.message.includes('fetch') ||
      error.message.includes('Network request failed') ||
      error.message.includes('Failed to fetch') ||
      error.message.includes('CORS') ||
      error.message.includes('cors')
    );

    if (retries > 0 && (isTimeout || isNetworkError)) {
      // Backoff mais rápido em desenvolvimento (tunnel já adiciona latência)
      const delay = __DEV__ ? 500 : Math.pow(2, 3 - retries) * 1000;
      if (__DEV__) {
        console.log(`🔄 Erro de rede/timeout: ${error instanceof Error ? error.message : 'Erro desconhecido'}, tentando novamente em ${delay}ms... (${retries} tentativas restantes)`);
        if (API_BASE_URL.includes('vercel')) {
          console.log('⏳ Pode ser cold start da Vercel, aguardando...');
        }
      }
      await new Promise(resolve => setTimeout(resolve, delay));
      return apiRequest(url, options, retries - 1);
    }

    if (__DEV__) {
      console.error(`❌ Falha final após todas as tentativas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      console.error(`📍 URL: ${url}`);
      console.error(`🌐 API Base: ${API_BASE_URL}`);
      console.error(`🔍 Tipo do erro:`, error instanceof Error ? error.constructor.name : typeof error);
    }
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