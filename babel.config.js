module.exports = function (api) {
  api.cache(true);
  return {
    presets: [require.resolve("babel-preset-expo")],
    plugins: [
      // zustand/middleware uses `import.meta.env` which causes a SyntaxError
      // in metro's non-module script context on web. This plugin rewrites
      // `import.meta` → `process` so `import.meta.env` becomes `process.env`.
      function importMetaEnvPlugin() {
        return {
          visitor: {
            MetaProperty(path) {
              path.replaceWithSourceString("process");
            },
          },
        };
      },
    ],
  };
};
