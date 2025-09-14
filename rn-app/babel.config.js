module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // For Expo SDK 54, react-native-reanimated plugin is already included via the preset.
    plugins: []
  };
};