# Guia de Publicação na Google Play Store

## 📋 Pré-requisitos

1. **Conta Google Play Console** (custo único de $25 USD)
2. **EAS Build** configurado (Expo Application Services)
3. **Assets preparados** (ícones, splash screens, screenshots)

## 🚀 Passo a Passo

### 1. Configurar EAS Build

```bash
# Instalar EAS CLI globalmente
npm install -g eas-cli

# Login no Expo
eas login

# Configurar projeto
cd movies_emotion
eas build:configure

# Criar arquivo eas.json (será criado automaticamente)
```

### 2. Configurar Variáveis de Ambiente

Criar arquivo `.env.production`:
```env
EXPO_PUBLIC_API_BASE_URL=https://moviesf-back.vercel.app
```

### 3. Preparar Assets

#### Ícones necessários:
- `icon.png` - 1024x1024px (já existe)
- `adaptive-icon.png` - 1024x1024px (já existe)

#### Splash Screen:
- `splash-icon.png` - 1242x2436px (já existe)

#### Screenshots para Google Play (necessários):
- **Phone**: 1080x1920px (mínimo 2, máximo 8)
- **Tablet**: 1200x1920px (opcional)

### 4. Build de Produção

```bash
# Build para Android (APK ou AAB)
eas build --platform android --profile production

# Ou build local (mais rápido para testes)
eas build --platform android --profile production --local
```

**Nota**: Para publicação na Play Store, use **AAB** (Android App Bundle), não APK.

### 5. Configurar app.json

Atualizar `app.json` com:
- Nome do app: "Vibesfilm"
- Package name: "com.vibesfilm.app"
- Version code: incrementar a cada release
- Version name: seguir semver (ex: "1.0.1")

### 6. Criar Conta Google Play Console

1. Acessar: https://play.google.com/console
2. Criar conta (pagamento único de $25 USD)
3. Criar novo app
4. Preencher informações:
   - **Nome do app**: Vibesfilm
   - **Idioma padrão**: Português (Brasil)
   - **Tipo de app**: App
   - **Gratuito ou pago**: Gratuito

### 7. Preencher Informações na Play Console

#### Informações do app:
- **Título**: Vibesfilm
- **Descrição curta**: Encontre o filme perfeito para sua vibe emocional
- **Descrição completa**: 
  ```
  Vibesfilm é um aplicativo inovador que ajuda você a encontrar o filme perfeito 
  baseado no seu estado emocional atual. Escolha como você está se sentindo e 
  descubra recomendações personalizadas de filmes que combinam com sua vibe.
  
  Características:
  - Navegação por sentimentos e intenções emocionais
  - Recomendações personalizadas de filmes
  - Informações sobre plataformas de streaming
  - Análise emocional detalhada de cada filme
  - Interface intuitiva e moderna
  ```

#### Categoria:
- **Categoria principal**: Entretenimento
- **Categoria secundária**: Estilo de vida

#### Classificação de conteúdo:
- Responder questionário sobre conteúdo do app
- Classificação esperada: **Livre para todos**

### 8. Upload do AAB

1. Na Play Console, ir em **Produção** > **Criar nova versão**
2. Fazer upload do arquivo `.aab` gerado pelo EAS Build
3. Preencher **Notas da versão** (ex: "Versão inicial do app")

### 9. Screenshots e Assets Gráficos

#### Screenshots obrigatórios:
- **Phone**: Mínimo 2 screenshots (1080x1920px)
- Sugestão: Tela inicial, Tela de sentimentos, Tela de detalhes do filme

#### Imagem de destaque:
- **Banner**: 1024x500px (opcional, mas recomendado)

#### Ícone de alta resolução:
- **512x512px** (será gerado automaticamente do icon.png)

### 10. Política de Privacidade

Criar e hospedar política de privacidade (obrigatório):
- Criar página HTML com política de privacidade
- Hospedar em URL pública (ex: GitHub Pages, Vercel)
- Adicionar URL na Play Console

**Template básico**:
```html
<!DOCTYPE html>
<html>
<head>
    <title>Política de Privacidade - Vibesfilm</title>
</head>
<body>
    <h1>Política de Privacidade</h1>
    <p>O Vibesfilm não coleta dados pessoais dos usuários.</p>
    <p>O app apenas faz requisições para APIs públicas para buscar informações sobre filmes.</p>
    <p>Última atualização: [DATA]</p>
</body>
</html>
```

### 11. Testes Internos

Antes de publicar:
1. Criar **Teste interno** na Play Console
2. Adicionar testadores (emails)
3. Testar o app em dispositivos reais
4. Verificar todas as funcionalidades

### 12. Publicação

1. Revisar todas as informações
2. Clicar em **Enviar para revisão**
3. Aguardar aprovação (geralmente 1-3 dias úteis)

## 📝 Checklist Final

- [ ] EAS Build configurado
- [ ] Build AAB gerado com sucesso
- [ ] app.json atualizado com informações corretas
- [ ] Screenshots preparados (mínimo 2)
- [ ] Descrição do app escrita
- [ ] Política de privacidade criada e hospedada
- [ ] Testes internos realizados
- [ ] Classificação de conteúdo preenchida
- [ ] Informações de contato preenchidas na Play Console

## 🔧 Comandos Úteis

```bash
# Verificar configuração atual
eas build:configure

# Ver builds anteriores
eas build:list

# Ver detalhes de um build específico
eas build:view [BUILD_ID]

# Atualizar app.json antes do build
# Incrementar versionCode e version
```

## 📚 Recursos

- [Documentação EAS Build](https://docs.expo.dev/build/introduction/)
- [Google Play Console](https://play.google.com/console)
- [Guia de Publicação Google Play](https://support.google.com/googleplay/android-developer/answer/9859152)

## ⚠️ Notas Importantes

1. **Version Code**: Deve ser incrementado a cada release (1, 2, 3...)
2. **Version Name**: Pode seguir semver (1.0.0, 1.0.1, 1.1.0...)
3. **Package Name**: Não pode ser alterado após publicação
4. **AAB vs APK**: Use sempre AAB para produção
5. **Testes**: Sempre teste em dispositivos reais antes de publicar

