# Vibesfilm Mobile App

Aplicação mobile do Vibesfilm - plataforma de recomendação de filmes baseada em estados emocionais.

## 📱 Sobre o Projeto

O Vibesfilm Mobile é a versão mobile da plataforma que recomenda filmes baseados em jornadas emocionais. A aplicação permite aos usuários:

- Selecionar seu estado emocional atual
- Escolher uma intenção emocional (Processar, Transformar, Manter, Explorar)
- Navegar por uma jornada personalizada
- Receber sugestões de filmes personalizadas
- Visualizar detalhes completos dos filmes

## 🛠️ Tecnologias

- **Framework**: React Native + Expo SDK 54
- **Navegação**: Expo Router v6 (file-system routing)
- **TypeScript**: Tipagem completa
- **Design System**: Tema customizado com cores e tipografia
- **Ícones**: @expo/vector-icons
- **Safe Area**: react-native-safe-area-context

## 📁 Estrutura do Projeto

```
movies_emotion/
├── app/                          # Rotas da aplicação (Expo Router)
│   ├── _layout.tsx               # Layout raiz
│   ├── index.tsx                 # Tela inicial
│   ├── config.ts                 # Configuração da API
│   ├── theme.ts                  # Sistema de design
│   ├── types/index.ts           # Tipos TypeScript
│   ├── sentimentos.tsx           # Seleção de sentimentos
│   ├── intencoes/[id].tsx        # Seleção de intenções
│   ├── jornada-personalizada/[sentimentId]/[intentionId].tsx  # Jornada
│   ├── filme/[id].tsx            # Detalhes do filme
│   └── components/               # Componentes reutilizáveis
│       ├── SentimentIcon.tsx     # Ícones de sentimentos
│       ├── IntentionIcon.tsx    # Ícones de intenções
│       └── NavigationFooter.tsx  # Footer de navegação
├── assets/                       # Recursos estáticos
├── package.json                  # Dependências
├── app.json                      # Configuração do Expo
└── tsconfig.json                 # Configuração TypeScript
```

## 🚀 Instalação e Execução

### Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Expo CLI (`npm install -g @expo/cli`)

### Instalação

1. **Navegue até o diretório:**
   ```bash
   cd /home/cabrazil/newprojs/fav_movies/movies_emotion
   ```

2. **Instale as dependências (use --legacy-peer-deps para resolver conflitos):**
   ```bash
   npm install --legacy-peer-deps
   ```

   Isso já instalará o Expo SDK 54 e todas as dependências compatíveis.

### Execução

#### Expo Go no Celular (Recomendado)
```bash
npx expo start
```
Escaneie o QR Code com o app Expo Go no seu celular.

#### Web (Desenvolvimento)
```bash
npm run web
# ou
npx expo start --web
```

#### Android
```bash
npm run android
# ou
npx expo start --android
```

#### iOS
```bash
npm run ios
# ou
npx expo start --ios
```

## ⚙️ Configuração

### Variáveis de Ambiente

O app usa detecção automática de ambiente:

- **Desenvolvimento**: Usa API de produção (`https://moviesf-back.vercel.app`)
- **Produção**: Usa API de produção (`https://moviesf-back.vercel.app`)

Para usar ngrok local (desenvolvimento):
```bash
export EXPO_PUBLIC_API_BASE_URL="https://sua-url.ngrok-free.app"
npx expo start
```

### API Endpoints

A aplicação consome os seguintes endpoints:

- `GET /main-sentiments/summary` - Lista de sentimentos
- `GET /main-sentiments/{id}` - Detalhes do sentimento
- `GET /api/emotional-intentions/{sentimentId}` - Intenções emocionais
- `GET /api/personalized-journey/{sentimentId}/{intentionId}` - Jornada personalizada
- `GET /movies/{id}` - Detalhes do filme

## 🎨 Design System

### Cores
- **Background**: Tema escuro elegante (#1C1C2C)
- **Primary**: Dourado (#1d917d)
- **Sentimentos**: Cores específicas por ID

### Tipografia
- **Fonte**: Inter
- **Tamanhos**: h1 (32px) até tiny (12px)
- **Pesos**: Regular (400) até Bold (700)

## 🔄 Fluxo da Aplicação

1. **Home** → Seleção de sentimento
2. **Sentimentos** → Seleção de intenção emocional
3. **Intenções** → Jornada personalizada
4. **Jornada** → Sugestões de filmes
5. **Filmes** → Detalhes e onde assistir

## 🐛 Troubleshooting

### Problema: "Expo Go SDK incompatível"
**Solução**: O package.json já está configurado para SDK 54. Se ainda tiver problemas:
```bash
npm install --legacy-peer-deps
```

### Problema: Dependências faltando
**Solução**: Instale todas as dependências:
```bash
npm install --legacy-peer-deps
```

### Problema: Metro bundler com erro
**Solução**: Limpe o cache:
```bash
npx expo start --clear
```

### Problema: Versão do Node antiga
Os pacotes Metro requerem Node.js >= 20.19.4. Se você tiver uma versão anterior, atualize o Node ou ignore os warnings.

## 📱 Compatibilidade

### Expo SDK 54
Este projeto está configurado para usar o **Expo SDK 54**, compatível com a versão atual do Expo Go (54.0.0).

Todas as dependências já estão alinhadas com o SDK 54.

## 🚀 Deploy

### Expo Build
```bash
npx expo build:android
npx expo build:ios
```

### EAS Build (Recomendado)
```bash
eas build --platform android
eas build --platform ios
```

## 📄 Licença

Este projeto é parte do ecossistema Vibesfilm.

---

**Desenvolvido com ❤️ para conectar pessoas com filmes através de suas emoções.**
