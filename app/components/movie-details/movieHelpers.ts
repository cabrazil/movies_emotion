// Helper para construir URL do logo
export const getPlatformLogoUrl = (logoPath: string | null, platformName: string): string => {
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

// Função para traduzir categorias do Oscar
export const translateOscarCategory = (category: string): string => {
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


