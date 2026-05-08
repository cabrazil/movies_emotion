module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Nota: react-native-reanimated/plugin será adicionado quando necessário
    // Por ora, usamos apenas o Animated nativo do React Native
    plugins: [],
  };
};
