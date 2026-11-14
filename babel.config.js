module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // WatermelonDB memakai decorator (@field, dll.) dengan sintaks "legacy".
    plugins: [['@babel/plugin-proposal-decorators', { legacy: true }]],
  };
};
