import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Share, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { API_ENDPOINTS, apiRequest } from '../config';
import { NavigationFooter } from '../components/NavigationFooter';
import { AppHeader } from '../components/AppHeader';
import { RatingRow } from '../components/RatingIcon';

  // Helper para construir URL do logo
  const getPlatformLogoUrl = (logoPath: string | null, platformName: string): string => {
    // Caso especial: YouTube sempre usa ícone do Ionicons
    if (platformName.toLowerCase().includes('youtube')) {
      return 'YOUTUBE_ICON'; // String especial para identificar YouTube
    }
    
    // Para outras plataformas, usar logoPath do Supabase
    if (!logoPath) return '';
    
    // Se já for uma URL completa, retornar como está
    if (logoPath.startsWith('http://') || logoPath.startsWith('https://')) {
      return logoPath;
    }
    
    // Se é um path do TMDB, constrói a URL completa
    if (logoPath.startsWith('/') && (logoPath.includes('.jpg') || logoPath.includes('.png') || logoPath.includes('.jpeg'))) {
      return `https://image.tmdb.org/t/p/w92${logoPath}`;
    }
    
    // Caso contrário, retornar o logoPath como está (pode ser uma URL do Supabase)
    return logoPath;
  };

interface StreamingPlatform {
  id: number;
  name: string;
  logoPath: string;
  category: string;
  hasFreeTrial: boolean;
  freeTrialDuration?: number;
  baseUrl?: string;
}

interface MoviePlatform {
  accessType: string;
  streamingPlatform: StreamingPlatform;
}

interface Movie {
  id: string;
  title: string;
  original_title?: string;
  thumbnail?: string;
  year?: number;
  director?: string;
  vote_average?: number;
  certification?: string;
  genres?: string[];
  runtime?: number;
  description?: string;
  streamingPlatforms?: string[];
  platforms?: MoviePlatform[];
  imdbRating?: number;
  imdb_rating?: number;
  rottenTomatoesRating?: number;
  metacriticRating?: number;
  landingPageHook?: string;
  targetAudienceForLP?: string;
  contentWarnings?: string;
  mainCast?: Array<{
    actorName: string;
    characterName?: string;
  }>;
  oscarAwards?: {
    wins: Array<{
      categoryName?: string;
      category?: string;
      personName?: string;
      year?: string;
    }>;
    nominations: Array<{
      categoryName?: string;
      category?: string;
      personName?: string;
      year?: string;
    }>;
  };
  awardsSummary?: string;
}

export default function MovieDetailsScreen() {
  const { id, reason, sentimentId } = useLocalSearchParams();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFullSynopsis, setShowFullSynopsis] = useState(false);
  const [showFullCast, setShowFullCast] = useState(false);
  const [showFullNominations, setShowFullNominations] = useState(false);
  const router = useRouter();

  // Obter cor do sentimento
  const sentimentColor = sentimentId ? (colors.sentimentColors[Number(sentimentId)] || colors.primary.main) : colors.primary.main;

  // Função para traduzir categorias do Oscar (versão completa)
  const translateOscarCategory = (category: string) => {
    const translations: { [key: string]: string } = {
      'BEST PICTURE': 'Melhor Filme',
      'BEST DIRECTOR': 'Melhor Diretor',
      'BEST ACTOR': 'Melhor Ator',
      'BEST ACTRESS': 'Melhor Atriz',
      'BEST SUPPORTING ACTOR': 'Melhor Ator Coadjuvante',
      'BEST SUPPORTING ACTRESS': 'Melhor Atriz Coadjuvante',
      'BEST ORIGINAL SCREENPLAY': 'Melhor Roteiro Original',
      'BEST ADAPTED SCREENPLAY': 'Melhor Roteiro Adaptado',
      'BEST CINEMATOGRAPHY': 'Melhor Fotografia',
      'BEST FILM EDITING': 'Melhor Edição',
      'BEST PRODUCTION DESIGN': 'Melhor Direção de Arte',
      'BEST COSTUME DESIGN': 'Melhor Figurino',
      'BEST MAKEUP AND HAIRSTYLING': 'Melhor Maquiagem e Penteados',
      'BEST SOUND': 'Melhor Som',
      'BEST SOUND EDITING': 'Melhor Edição de Som',
      'SOUND EFFECTS EDITING': 'Melhor Edição de Efeitos Sonoros',
      'BEST SOUND MIXING': 'Melhor Mixagem de Som',
      'BEST VISUAL EFFECTS': 'Melhores Efeitos Visuais',
      'BEST ORIGINAL SCORE': 'Melhor Trilha Sonora Original',
      'BEST ORIGINAL SONG': 'Melhor Canção Original',
      'MUSIC (Original Score)': 'Melhor Trilha Sonora Original',
      'WRITING (Original Screenplay)': 'Melhor Roteiro Original',
      'WRITING (Adapted Screenplay)': 'Melhor Roteiro Adaptado',
      'WRITING (Story and Screenplay--written directly for the screen)': 'Melhor Roteiro Original',
      'WRITING (Screenplay Based on Material from Another Medium)': 'Melhor Roteiro Adaptado',
      'WRITING (Screenplay Based on Material Previously Produced or Published)': 'Melhor Roteiro baseado em material produzido ou publicado anteriormente',
      'BEST INTERNATIONAL FEATURE FILM': 'Melhor Filme Internacional',
      'BEST DOCUMENTARY FEATURE': 'Melhor Documentário',
      'BEST DOCUMENTARY SHORT SUBJECT': 'Melhor Documentário em Curta-Metragem',
      'BEST ANIMATED FEATURE FILM': 'Melhor Filme de Animação',
      'BEST ANIMATED SHORT FILM': 'Melhor Curta-Metragem de Animação',
      'BEST LIVE ACTION SHORT FILM': 'Melhor Curta-Metragem de Ação ao Vivo',
      'ACTOR IN A LEADING ROLE': 'Melhor Ator',
      'ACTRESS IN A LEADING ROLE': 'Melhor Atriz',
      'ACTOR IN A SUPPORTING ROLE': 'Melhor Ator Coadjuvante',
      'ACTRESS IN A SUPPORTING ROLE': 'Melhor Atriz Coadjuvante',
      'DIRECTING': 'Melhor Diretor',
      'CINEMATOGRAPHY': 'Melhor Fotografia',
      'FILM EDITING': 'Melhor Edição',
      'PRODUCTION DESIGN': 'Melhor Direção de Arte',
      'ART DIRECTION': 'Melhor Direção de Arte',
      'COSTUME DESIGN': 'Melhor Figurino',
      'MAKEUP AND HAIRSTYLING': 'Melhor Maquiagem e Penteados',
      'SOUND': 'Melhor Som',
      'SOUND MIXING': 'Melhor Mixagem de Som',
      'SOUND EDITING': 'Melhor Edição de Som',
      'VISUAL EFFECTS': 'Melhores Efeitos Visuais',
      'SPECIAL VISUAL EFFECTS': 'Melhores Efeitos Visuais',
      'ORIGINAL SCORE': 'Melhor Trilha Sonora Original',
      'ORIGINAL SONG': 'Melhor Canção Original',
      'MUSIC (Original Dramatic Score)': 'Melhor Trilha Sonora Original',
      'MUSIC (Original Song)': 'Melhor Canção Original',
      'WRITING (Screenplay Written Directly for the Screen)': 'Melhor Roteiro Original',
      'INTERNATIONAL FEATURE FILM': 'Melhor Filme Internacional',
      'DOCUMENTARY FEATURE': 'Melhor Documentário',
      'ANIMATED FEATURE FILM': 'Melhor Filme de Animação',
      // Versões com "Best" no início (formato mais comum)
      'Best Picture': 'Melhor Filme',
      'Best Director': 'Melhor Diretor',
      'Best Actor': 'Melhor Ator',
      'Best Actress': 'Melhor Atriz',
      'Best Supporting Actor': 'Melhor Ator Coadjuvante',
      'Best Supporting Actress': 'Melhor Atriz Coadjuvante',
      'Best Original Screenplay': 'Melhor Roteiro Original',
      'Best Adapted Screenplay': 'Melhor Roteiro Adaptado',
      'Best Cinematography': 'Melhor Fotografia',
      'Best Film Editing': 'Melhor Edição',
      'Best Original Score': 'Melhor Trilha Sonora Original',
      'Best Original Song': 'Melhor Canção Original',
      'Best Production Design': 'Melhor Direção de Arte',
      'Best Costume Design': 'Melhor Figurino',
      'Best Makeup and Hairstyling': 'Melhor Maquiagem e Penteados',
      'Best Sound': 'Melhor Som',
      'Best Visual Effects': 'Melhores Efeitos Visuais',
      'Best Animated Feature': 'Melhor Filme de Animação',
      'Best Foreign Language Film': 'Melhor Filme Estrangeiro',
      'Best Documentary Feature': 'Melhor Documentário',
      'Best Documentary Short': 'Melhor Documentário Curto',
      'Best Live Action Short': 'Melhor Curta-Metragem',
      'Best Animated Short': 'Melhor Curta-Metragem de Animação'
    };
    return translations[category] || category;
  };

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        console.log('Buscando filme com ID:', id);
        const url = `${API_ENDPOINTS.movies.detail(id.toString())}`;
        console.log('URL da requisição:', url);
        
        const res = await apiRequest(url);
        console.log('Status da resposta:', res.status);
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => null);
          console.error('Erro na resposta:', errorData);
          throw new Error(errorData?.error || 'Erro ao carregar filme');
        }
        
        const data = await res.json();
        console.log('Dados do filme:', data);
        
        // O endpoint /api/movie/{id}/details retorna { movie: {...}, subscriptionPlatforms: [...] }
        const movieData = data.movie || data;
        const platforms = data.subscriptionPlatforms || data.platforms || [];
        
        console.log('Título original:', movieData.original_title);
        console.log('landingPageHook:', movieData.landingPageHook);
        console.log('targetAudienceForLP:', movieData.targetAudienceForLP);
        console.log('contentWarnings:', movieData.contentWarnings);
        console.log('Ratings:', {
          imdbRating: movieData.imdbRating,
          rottenTomatoesRating: movieData.rottenTomatoesRating,
          metacriticRating: movieData.metacriticRating,
          vote_average: movieData.vote_average
        });
        console.log('Plataformas:', platforms);
        console.log('Elenco Principal:', movieData.mainCast);
        
        // Mapear os dados para o formato esperado pelo mobile
        const processedMovieData = {
          id: movieData.id,
          title: movieData.title,
          original_title: movieData.original_title,
          thumbnail: movieData.thumbnail,
          year: movieData.year,
          director: movieData.director,
          vote_average: movieData.vote_average,
          certification: movieData.certification,
          genres: movieData.genres,
          runtime: movieData.runtime,
          description: movieData.description,
          platforms: platforms,
          imdbRating: movieData.imdbRating,
          imdb_rating: movieData.imdb_rating,
          rottenTomatoesRating: movieData.rottenTomatoesRating,
          metacriticRating: movieData.metacriticRating,
          landingPageHook: movieData.landingPageHook,
          targetAudienceForLP: movieData.targetAudienceForLP,
          contentWarnings: movieData.contentWarnings,
          mainCast: movieData.mainCast,
          oscarAwards: movieData.oscarAwards,
          awardsSummary: movieData.awardsSummary,
        };
        
        setMovie(processedMovieData);
        setLoading(false);
      } catch (err) {
        console.error('Erro detalhado:', err);
        setError(`Erro ao carregar filme: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
        setLoading(false);
      }
    };

    fetchMovie();
  }, [id]);

  const handleShare = async () => {
    if (!movie) return;
    
    try {
      await Share.share({
        message: `Confira o filme "${movie.title}" (${movie.year}) - ${movie.description}`,
        title: movie.title,
      });
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
    }
  };

  const handleTrailer = () => {
    // Por enquanto, vamos apenas mostrar um alerta
    // Em uma implementação real, você abriria o YouTube ou outro serviço de vídeo
    alert('Funcionalidade de trailer será implementada em breve!');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader showBack={true} showLogo={true} />
      <View style={styles.center}>
        <Text style={styles.loadingText}>Carregando filme...</Text>
      </View>
      </SafeAreaView>
    );
  }

  if (error || !movie) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader showBack={true} showLogo={true} />
      <View style={styles.center}>
        <Text style={styles.errorText}>{error || 'Filme não encontrado'}</Text>
      </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader showBack={true} showLogo={true} />
    <View style={styles.fullContainer}>
      <ScrollView style={styles.container}>
        {/* Header do Filme */}
        <View style={styles.movieHeader}>
        {movie.thumbnail && (
            <View style={styles.posterContainer}>
              <Image 
                source={{ uri: movie.thumbnail }} 
                style={styles.poster} 
                resizeMode="cover"
              />
          </View>
        )}
        
          <View style={styles.movieInfo}>
            <View style={styles.titleSection}>
              <Text style={styles.movieTitle}>{movie.title}</Text>
            {movie.year && (
                <Text style={[styles.movieYear, { color: sentimentColor }]}>({movie.year})</Text>
              )}
              {movie.original_title && (
                <Text style={styles.originalTitle}>Título Original: {movie.original_title}</Text>
              )}
            </View>
            
            <View style={styles.movieMeta}>
              {/* Diretor */}
              {movie.director && (
                <Text style={styles.metaText}>Diretor: {movie.director}</Text>
              )}
              
              {/* Duração e Classificação na mesma linha */}
              <View style={styles.runtimeCertificationRow}>
            {movie.runtime && (
                  <Text style={styles.metaText}>
                    {(() => {
                      const hours = Math.floor(movie.runtime / 60);
                      const minutes = movie.runtime % 60;
                      return hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
                    })()}
                  </Text>
            )}
            {movie.certification && (
                  <>
                    <Text style={styles.metaSeparator}>|</Text>
                    <Text style={[styles.certificationText, { color: sentimentColor }]}>{movie.certification}</Text>
                  </>
                )}
              </View>
            </View>
            
            <TouchableOpacity style={[styles.trailerButton, { backgroundColor: sentimentColor }]} onPress={handleTrailer}>
              <Ionicons name="play-circle" size={20} color={colors.text.inverse} />
              <Text style={styles.trailerButtonText}>Assistir Trailer</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Seção "Onde assistir hoje?" */}
        <View style={styles.streamingSection}>
          <Text style={styles.sectionTitle}>Onde assistir hoje?</Text>
          
          <View style={styles.platformsContainer}>
            {/* Plataformas de Assinatura */}
            {movie.platforms && movie.platforms.filter(p => p.accessType === 'INCLUDED_WITH_SUBSCRIPTION').length > 0 && (
              <View style={styles.subscriptionPlatforms}>
                <Text style={styles.platformCategoryTitle}>Assinatura:</Text>
                <View style={styles.platformsGrid}>
                  {movie.platforms
                    .filter(p => p.accessType === 'INCLUDED_WITH_SUBSCRIPTION')
                    .map((platform, index) => (
                      <TouchableOpacity 
                        key={index} 
                        style={[styles.platformLogoItem, { borderColor: sentimentColor + '40' }]}
                        onPress={() => {
                          const platformData = platform.streamingPlatform || platform;
                          if (platformData.baseUrl) {
                            // Aqui você pode abrir o link da plataforma
                            console.log('Abrindo:', platformData.baseUrl);
                          }
                        }}
                      >
                        <View style={styles.platformLogoContainer}>
                          {(() => {
                            // Nova estrutura: platform tem os dados diretamente
                            const platformData = platform.streamingPlatform || platform;
                            const logoUrl = getPlatformLogoUrl(platformData.logoPath, platformData.name);
                            
                            if (logoUrl === 'YOUTUBE_ICON') {
                              return <Ionicons name="logo-youtube" size={32} color="#FF0000" />;
                            }
                            
                            return logoUrl ? (
                              <Image 
                                source={{ uri: logoUrl }} 
                                style={styles.platformLogoImage}
                                resizeMode="contain"
                              />
                            ) : (
                              <Ionicons name="tv" size={32} color={sentimentColor} />
                            );
                          })()}
                        </View>
                        {(platform.streamingPlatform || platform).hasFreeTrial && (
                          <View style={styles.freeTrialBadge}>
                            <Text style={styles.freeTrialBadgeText}>
                              {(platform.streamingPlatform || platform).freeTrialDuration ? 
                                `${(platform.streamingPlatform || platform).freeTrialDuration} dias grátis` : 
                                'Teste grátis'
                              }
                            </Text>
              </View>
            )}
                      </TouchableOpacity>
                    ))}
                </View>
              </View>
            )}
            
            {/* Plataformas de Aluguel ou Compra */}
            {movie.platforms && movie.platforms.filter(p => p.accessType === 'RENTAL' || p.accessType === 'PURCHASE').length > 0 && (
              <View style={styles.rentalPlatforms}>
                <Text style={styles.platformCategoryTitle}>Aluguel ou Compra:</Text>
                <View style={styles.platformsGrid}>
                  {(() => {
                    // Unificar plataformas - uma por plataforma, mesmo que tenha múltiplos accessTypes
                    const rentalPurchasePlatforms = movie.platforms.filter(p => p.accessType === 'RENTAL' || p.accessType === 'PURCHASE');
                    const uniquePlatforms = new Map();
                    
                    rentalPurchasePlatforms.forEach(platform => {
                      const platformId = (platform.streamingPlatform || platform).id;
                      if (!uniquePlatforms.has(platformId)) {
                        uniquePlatforms.set(platformId, platform);
                      }
                    });
                    
                    return Array.from(uniquePlatforms.values()).map((platform, index) => (
                      <TouchableOpacity 
                        key={index} 
                        style={[styles.platformLogoItem, { borderColor: sentimentColor + '40' }]}
                        onPress={() => {
                          const platformData = platform.streamingPlatform || platform;
                          if (platformData.baseUrl) {
                            console.log('Abrindo:', platformData.baseUrl);
                          }
                        }}
                      >
                        <View style={styles.platformLogoContainer}>
                          {(() => {
                            // Nova estrutura: platform tem os dados diretamente
                            const platformData = platform.streamingPlatform || platform;
                            const logoUrl = getPlatformLogoUrl(platformData.logoPath, platformData.name);
                            
                            if (logoUrl === 'YOUTUBE_ICON') {
                              return <Ionicons name="logo-youtube" size={32} color="#FF0000" />;
                            }
                            
                            return logoUrl ? (
                              <Image 
                                source={{ uri: logoUrl }} 
                                style={styles.platformLogoImage}
                                resizeMode="contain"
                              />
                            ) : (
                              <Ionicons name="card" size={32} color={sentimentColor} />
                            );
                          })()}
                        </View>
                      </TouchableOpacity>
                    ));
                  })()}
                </View>
              </View>
            )}
          </View>

          {/* Mensagem quando não há plataformas */}
          {(!movie.platforms || movie.platforms.length === 0) && (
            <View style={styles.noPlatformsContainer}>
              <Text style={styles.noPlatformsText}>
                Este filme não está disponível para streaming no momento.
                </Text>
              </View>
            )}
          
          <Text style={styles.disclaimerText}>
            * Os períodos e termos de teste grátis podem variar. Consulte a plataforma para detalhes atualizados.
          </Text>
          </View>


        {/* Seção Análise Emocional do Vibesfilm */}
        <View style={styles.emotionalAnalysisSection}>
          <Text style={styles.sectionTitle}>A Análise Emocional do Vibesfilm</Text>
          
          {/* Alerta de Conteúdo */}
          {movie?.contentWarnings && 
           movie.contentWarnings !== 'Atenção: nenhum alerta de conteúdo significativo.' && (
            <View style={styles.contentAlert}>
              <View style={styles.alertHeader}>
                <Ionicons name="warning" size={20} color={colors.state.warning} />
                <Text style={styles.alertTitle}>Alerta de Conteúdo</Text>
              </View>
              <Text style={styles.alertText}>
                <Text style={styles.alertBold}>Atenção: </Text>
                {movie.contentWarnings.replace('Atenção: ', '')}
              </Text>
            </View>
          )}
          
          {/* A Vibe do Filme */}
          <View style={[styles.vibeSection, { borderColor: sentimentColor }]}>
            <Text style={styles.subsectionTitle}>A Vibe do Filme</Text>
            <Text style={styles.vibeText}>
              {movie.landingPageHook ? 
                movie.landingPageHook.replace(/<[^>]*>/g, '') :
                `Prepare-se para uma experiência cinematográfica única com ${movie.title}, um filme que oferece uma narrativa envolvente e personagens profundos.`
              }
            </Text>
          </View>
          
          {/* Para Quem Recomendamos */}
          <View style={[styles.recommendationSection, { borderColor: sentimentColor }]}>
            <Text style={styles.subsectionTitle}>Para Quem Recomendamos?</Text>
            <Text style={styles.recommendationText}>
              {movie.targetAudienceForLP ? 
                movie.targetAudienceForLP :
                "Este filme pode ser perfeito para quem busca uma experiência cinematográfica única e envolvente."
              }
            </Text>
          </View>
          
          {/* Por que recomendamos para você */}
          <View style={[styles.recommendationSection, { borderColor: sentimentColor }]}>
            <Text style={styles.subsectionTitle}>Por que recomendamos para você?</Text>
            <Text style={styles.recommendationText}>
              {(() => {
                if (!sentimentId || !reason) {
                  return movie.landingPageHook ? 
                    movie.landingPageHook.replace(/<[^>]*>/g, '') : 
                    "Este filme oferece uma experiência cinematográfica única que vale a pena assistir.";
                }

                // Mapear sentimentos para nomes amigáveis
                const sentimentNames: { [key: number]: string } = {
                  13: "Feliz / Alegre",
                  14: "Triste", 
                  15: "Calmo(a)",
                  16: "Ansioso(a)",
                  17: "Animado(a)",
                  18: "Cansado(a)"
                };

                const sentimentName = sentimentNames[Number(sentimentId)] || "emocional";
                const reasonText = Array.isArray(reason) ? reason[0] : reason;
                const formattedReason = reasonText.charAt(0).toLowerCase() + reasonText.slice(1);

                return `Para quem está ${sentimentName} e quer Processar, este filme traz ${formattedReason}`;
              })()}
            </Text>
          </View>
        </View>
        
        {/* Tags Emocionais Chave */}
        <View style={styles.emotionalTagsSection}>
          <Text style={styles.subsectionTitle}>Tags Emocionais Chave:</Text>
          <View style={styles.tagsContainer}>
            <View style={[styles.emotionalTag, { borderColor: sentimentColor }]}>
              <Text style={[styles.tagText, { color: sentimentColor }]}>Leveza / Diversão Descompromissada</Text>
            </View>
            <View style={[styles.emotionalTag, { borderColor: sentimentColor }]}>
              <Text style={[styles.tagText, { color: sentimentColor }]}>Intriga Leve / Humor</Text>
            </View>
            <View style={[styles.emotionalTag, { borderColor: sentimentColor }]}>
              <Text style={[styles.tagText, { color: sentimentColor }]}>Conforto / Aconchego Emocional</Text>
            </View>
            <View style={[styles.emotionalTag, { borderColor: sentimentColor }]}>
              <Text style={[styles.tagText, { color: sentimentColor }]}>Doçura / Encanto</Text>
            </View>
          </View>
        </View>

        {/* Seção Sinopse */}
        <View style={styles.synopsisSection}>
          <Text style={styles.sectionTitle}>Sinopse</Text>
          <Text style={styles.synopsisText}>
            {(() => {
              const synopsis = movie.description || 'Sinopse não disponível.';
              const maxLength = 200; // Limite de caracteres para mostrar "Ver mais"
              
              if (synopsis.length <= maxLength || showFullSynopsis) {
                return synopsis;
              }
              
              return synopsis.substring(0, maxLength) + '...';
            })()}
          </Text>
          {(() => {
            const synopsis = movie.description || 'Sinopse não disponível.';
            const maxLength = 200;
            
            if (synopsis.length > maxLength) {
              return (
                <TouchableOpacity 
                  style={styles.verMaisButton}
                  onPress={() => setShowFullSynopsis(!showFullSynopsis)}
                >
                  <Text style={[styles.verMaisText, { color: sentimentColor }]}>
                    {showFullSynopsis ? 'Ver menos' : 'Ver mais'}
                  </Text>
                </TouchableOpacity>
              );
            }
            return null;
          })()}
        </View>

        {/* Seção Notas e Gêneros */}
        <View style={styles.ratingsGenresSection}>
          <Text style={styles.sectionTitle}>Notas e Gêneros</Text>
          
          {/* Ratings */}
          <View style={styles.ratingsContainer}>
            <Text style={styles.ratingsTitle}>Notas da Crítica:</Text>
            {(() => {
              console.log('🔍 Debug Ratings:', {
                vote_average: movie.vote_average,
                imdbRating: movie.imdbRating,
                imdb_rating: movie.imdb_rating,
                rottenTomatoesRating: movie.rottenTomatoesRating,
                metacriticRating: movie.metacriticRating
              });
              return null;
            })()}
            <RatingRow 
              ratings={{
                tmdb: movie.vote_average,
                imdb: movie.imdbRating || movie.imdb_rating,
                rotten: movie.rottenTomatoesRating,
                metacritic: movie.metacriticRating,
              }}
            />
          </View>

          {/* Gêneros */}
          {movie.genres && movie.genres.length > 0 && (
            <View style={styles.genresContainer}>
              <Text style={styles.genresTitle}>Gêneros:</Text>
              <View style={styles.tagsContainer}>
                {movie.genres.map((genre) => (
                  <View key={genre} style={[styles.emotionalTag, { borderColor: sentimentColor }]}>
                    <Text style={[styles.tagText, { color: sentimentColor }]}>{genre}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
            </View>

        {/* Seção Elenco Principal */}
        {movie.mainCast && movie.mainCast.length > 0 && (
          <View style={styles.castSection}>
            <Text style={styles.sectionTitle}>Elenco Principal</Text>
            
            <View style={styles.castContainer}>
              {/* Mostrar apenas os primeiros 5 atores inicialmente */}
              {movie.mainCast.slice(0, showFullCast ? movie.mainCast.length : 5).map((actor, index) => (
                <View key={index} style={styles.castItem}>
                  <Text style={styles.actorName}>
                    {actor.actorName}
                    {actor.characterName && (
                      <Text style={styles.characterName}>
                        <Text style={styles.asText}> como </Text>
                        {actor.characterName}
                      </Text>
                    )}
                  </Text>
                </View>
              ))}
              
              {/* Ver mais/Ver menos - se houver mais de 5 atores */}
              {movie.mainCast.length > 5 && (
                <View style={styles.castToggleContainer}>
                  <TouchableOpacity onPress={() => setShowFullCast(!showFullCast)}>
                    <Text style={[styles.castToggleText, { color: sentimentColor }]}>
                      {showFullCast 
                        ? 'Ver menos...' 
                        : `Ver mais... (${movie.mainCast.length - 5} atores)`
                      }
                    </Text>
                  </TouchableOpacity>
            </View>
          )}
              </View>
            </View>
          )}

        {/* Seção Premiações e Reconhecimento */}
        <View style={styles.awardsSection}>
          <Text style={styles.sectionTitle}>Premiações e Reconhecimento</Text>
          
          {movie.oscarAwards && (movie.oscarAwards.wins.length > 0 || movie.oscarAwards.nominations.length > 0) ? (
            // Se tem dados estruturados do Oscar, mostrar versão detalhada
            <View style={styles.oscarAwardsContainer}>
              {/* Texto introdutório */}
              <Text style={styles.awardsIntroText}>
                {movie.title} foi indicado a {movie.oscarAwards.wins.length + movie.oscarAwards.nominations.length} Oscar{(movie.oscarAwards.wins.length + movie.oscarAwards.nominations.length) > 1 ? 's' : ''} em {movie.oscarAwards.wins.length > 0 ? movie.oscarAwards.wins[0].year : movie.oscarAwards.nominations[0]?.year}{movie.oscarAwards.wins.length > 0 ? ', ' : ''}{movie.oscarAwards.wins.length > 0 ? 'conquistou' : ''}:
              </Text>

              {/* Vitórias no Oscar - sempre visíveis */}
              {movie.oscarAwards.wins && movie.oscarAwards.wins.length > 0 && (
                <View style={styles.awardsList}>
                  {movie.oscarAwards.wins.map((win, index) => (
                    <View key={index} style={styles.awardItem}>
                      <Text style={styles.awardText}>
                        {translateOscarCategory(win.categoryName || win.category || '')} <Text style={styles.awardForText}>para</Text> <Text style={styles.awardPersonText}>{win.personName}</Text>
                      </Text>
                    </View>
                  ))}
            </View>
          )}

              {/* Indicações que não venceram - só aparecem no "Ver mais" */}
              {movie.oscarAwards.nominations && movie.oscarAwards.nominations.length > 0 && (
                <>
                  {/* Indicações extras - mostradas quando showFullNominations = true */}
                  {showFullNominations && (
                    <View style={styles.nominationsList}>
                      {movie.oscarAwards.nominations.map((nomination, index) => (
                        <View key={index} style={styles.awardItem}>
                          <Text style={styles.awardText}>
                            {translateOscarCategory(nomination.categoryName || nomination.category || '')} <Text style={styles.awardForText}>para</Text> <Text style={styles.awardPersonText}>{nomination.personName}</Text>
                          </Text>
                  </View>
                ))}
              </View>
                  )}

                  {/* Ver mais se houver indicações */}
                  {movie.oscarAwards.nominations.length > 0 && (
                    <View style={styles.awardsToggleContainer}>
                      <TouchableOpacity onPress={() => setShowFullNominations(!showFullNominations)}>
                        <Text style={[styles.awardsToggleText, { color: sentimentColor }]}>
                          {showFullNominations 
                            ? 'Ver menos...' 
                            : `Ver mais... (${movie.oscarAwards.nominations.length} ${movie.oscarAwards.nominations.length > 1 ? 'indicações' : 'indicação'})`
                          }
                        </Text>
                      </TouchableOpacity>
            </View>
          )}
                </>
              )}
            </View>
          ) : (
            // Layout para premiações gerais
            <View style={styles.generalAwardsContainer}>
              <Text style={styles.generalAwardsText}>
                {movie.awardsSummary && movie.awardsSummary.trim() !== '' && !movie.awardsSummary.toLowerCase().includes('oscar')
                  ? `Este filme recebeu "${movie.awardsSummary}" em outras cerimônias de premiações.`
                  : 'Este filme pode ter recebido outros reconhecimentos importantes em festivais e premiações especializadas.'
                }
              </Text>
            </View>
          )}
        </View>

        {/* Botão de Compartilhar */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={24} color={colors.primary.main} />
              <Text style={styles.actionButtonText}>Compartilhar</Text>
            </TouchableOpacity>
        </View>
      </ScrollView>
        
      <NavigationFooter backLabel="Filmes" showHome={true} />
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  fullContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  // Header do Filme
  movieHeader: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.background.primary,
  },
  posterContainer: {
    marginRight: spacing.md,
  },
  poster: {
    width: 120,
    height: 180,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.secondary,
  },
  movieInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  titleSection: {
    marginBottom: spacing.sm,
  },
  movieTitle: {
    fontSize: typography.fontSize.h3,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  movieYear: {
    fontSize: typography.fontSize.body,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
  },
  originalTitle: {
    fontSize: typography.fontSize.small,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.regular,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  movieMeta: {
    marginBottom: spacing.md,
  },
  metaText: {
    fontSize: typography.fontSize.small,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  runtimeCertificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    flexWrap: 'wrap',
  },
  metaSeparator: {
    fontSize: typography.fontSize.small,
    color: colors.text.secondary,
    marginHorizontal: spacing.sm,
  },
  certificationBadge: {
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  certificationText: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.medium,
  },
  trailerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignSelf: 'center',
    width: '100%',
  },
  trailerButtonText: {
    fontSize: typography.fontSize.body,
    color: colors.text.inverse,
    fontWeight: typography.fontWeight.medium,
    marginLeft: spacing.xs,
  },
  // Seção de Streaming
  streamingSection: {
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.h4,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  platformsContainer: {
    marginBottom: spacing.md,
  },
  subscriptionPlatforms: {
    marginBottom: spacing.lg,
  },
  rentalPlatforms: {
    marginBottom: spacing.md,
  },
  platformCategoryTitle: {
    fontSize: typography.fontSize.h4,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  platformsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'center',
  },
  platformLogoItem: {
    width: 80,
    height: 80,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  platformLogoContainer: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  platformLogoImage: {
    width: 40,
    height: 40,
  },
  freeTrialBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#4CAF50',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    minWidth: 60,
  },
  freeTrialBadgeText: {
    fontSize: typography.fontSize.tiny,
    color: colors.text.inverse,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
  },
  accessTypeBadge: {
    position: 'absolute',
    bottom: -8,
    left: -8,
    backgroundColor: '#FF6B35',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    minWidth: 50,
  },
  accessTypeBadgeText: {
    fontSize: typography.fontSize.tiny,
    color: colors.text.inverse,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
  },
  noPlatformsContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  noPlatformsText: {
    fontSize: typography.fontSize.small,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  disclaimerText: {
    fontSize: typography.fontSize.small,
    color: colors.text.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  // Seção Análise Emocional
  emotionalAnalysisSection: {
    padding: spacing.md,
    backgroundColor: colors.background.primary,

  },
  contentAlert: {
    backgroundColor: colors.state.warning + '20',
    borderLeftWidth: 4,
    borderLeftColor: colors.state.warning,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  alertTitle: {
    fontSize: typography.fontSize.h4,
    fontWeight: typography.fontWeight.bold,
    color: colors.state.warning,
    marginLeft: spacing.xs,
  },
  alertText: {
    fontSize: typography.fontSize.body,
    color: colors.text.primary,
    lineHeight: typography.fontSize.body * typography.lineHeight.normal,
  },
  alertBold: {
    fontWeight: typography.fontWeight.semibold,
  },
  vibeSection: {
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    marginBottom: spacing.lg,
  },
  recommendationSection: {
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    marginBottom: spacing.lg,
  },
  emotionalTagsSection: {
    padding: spacing.md,
    marginTop: -spacing.lg,
  },
  subsectionTitle: {
    fontSize: typography.fontSize.h4,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  vibeText: {
    fontSize: typography.fontSize.body,
    color: colors.text.secondary,
    lineHeight: typography.fontSize.body * typography.lineHeight.normal,
  },
  recommendationText: {
    fontSize: typography.fontSize.body,
    color: colors.text.secondary,
    lineHeight: typography.fontSize.body * typography.lineHeight.normal,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  emotionalTag: {
    backgroundColor: colors.primary.main + '20',
    borderWidth: 1,
    borderColor: colors.primary.main + '40',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  tagText: {
    fontSize: typography.fontSize.small,
    color: colors.primary.main,
    fontWeight: typography.fontWeight.medium,
  },
  // Seção Sinopse
  synopsisSection: {
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    marginBottom: spacing.md,
  },
  synopsisText: {
    fontSize: typography.fontSize.body,
    color: colors.text.secondary,
    lineHeight: typography.fontSize.body * typography.lineHeight.relaxed,
  },
  verMaisButton: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  verMaisText: {
    fontSize: typography.fontSize.small,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  // Seção Notas e Gêneros
  ratingsGenresSection: {
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    marginBottom: spacing.md,
  },
  ratingsContainer: {
    marginBottom: spacing.sm,
  },
  ratingsTitle: {
    fontSize: typography.fontSize.h4,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  ratingsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  ratingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  ratingLabel: {
    fontSize: typography.fontSize.small,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
    marginRight: spacing.xs,
    fontWeight: typography.fontWeight.medium,
  },
  ratingValue: {
    fontSize: typography.fontSize.small,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.bold,
  },
  content: {
    padding: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.h2,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    flexWrap: 'wrap',
  },
  detailText: {
    fontSize: typography.fontSize.body,
    color: colors.text.secondary,
    marginRight: spacing.md,
  },
  certificationContainer: {
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginRight: spacing.md,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: typography.fontSize.body,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
  },
  directorText: {
    fontSize: typography.fontSize.body,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  genresContainer: {
    marginBottom: spacing.xs,
  },
  genresTitle: {
    fontSize: typography.fontSize.h4,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  streamingContainer: {
    marginBottom: spacing.sm,
  },
  streamingTitle: {
    fontSize: typography.fontSize.h4,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  streamingPlatforms: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  platformTag: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  platformText: {
    fontSize: typography.fontSize.small,
    color: colors.background.card,
    fontWeight: typography.fontWeight.medium,
  },
  // Seção Elenco Principal
  castSection: {
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    marginBottom: spacing.md,
  },
  castContainer: {
    flexDirection: 'column',
    gap: spacing.sm,
  },
  castItem: {
    paddingVertical: spacing.xs,
  },
  actorName: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    lineHeight: 22,
  },
  characterName: {
    fontSize: typography.fontSize.small,
    color: colors.text.secondary,
    fontStyle: 'italic',
    fontWeight: typography.fontWeight.regular,
  },
  asText: {
    fontSize: typography.fontSize.small,
    color: '#666',
    fontStyle: 'normal',
    fontWeight: typography.fontWeight.regular,
  },
  castToggleContainer: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    alignItems: 'center',
  },
  castToggleText: {
    fontSize: typography.fontSize.small,
    color: colors.primary.main,
    fontWeight: typography.fontWeight.medium,
    textDecorationLine: 'underline',
  },
  // Seção Premiações e Reconhecimento
  awardsSection: {
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    marginBottom: spacing.md,
  },
  oscarAwardsContainer: {
    marginBottom: spacing.sm,
  },
  awardsIntroText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  awardsList: {
    marginBottom: spacing.sm,
  },
  nominationsList: {
    marginTop: spacing.sm,
  },
  awardItem: {
    paddingVertical: spacing.xs,
  },
  awardText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    lineHeight: 20,
  },
  awardForText: {
    fontSize: typography.fontSize.body,
    color: '#666',
    fontStyle: 'italic',
    fontWeight: typography.fontWeight.regular,
  },
  awardPersonText: {
    fontSize: typography.fontSize.small,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.regular,
  },
  awardsToggleContainer: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    alignItems: 'center',
  },
  awardsToggleText: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.medium,
    textDecorationLine: 'underline',
  },
  generalAwardsContainer: {
    paddingVertical: spacing.md,
  },
  generalAwardsText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    lineHeight: 22,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  actionButtonText: {
    fontSize: typography.fontSize.body,
    color: colors.primary.main,
    fontWeight: typography.fontWeight.medium,
    marginLeft: spacing.xs,
  },
  loadingText: {
    fontSize: typography.fontSize.body,
    color: colors.text.secondary,
  },
  errorText: {
    fontSize: typography.fontSize.body,
    color: colors.state.error,
  },
  reasonContainer: {
    backgroundColor: colors.background.secondary,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  reasonTitle: {
    fontSize: typography.fontSize.h4,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  reasonText: {
    fontSize: typography.fontSize.body,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  descriptionContainer: {
    marginBottom: spacing.lg,
  },
  descriptionTitle: {
    fontSize: typography.fontSize.h4,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  descriptionText: {
    fontSize: typography.fontSize.body,
    color: colors.text.secondary,
    lineHeight: typography.fontSize.body * typography.lineHeight.normal,
  },
}); 