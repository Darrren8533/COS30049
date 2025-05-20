module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Add WASM file type support
      webpackConfig.module.rules.push({
        test: /\.wasm$/,
        type: 'asset/resource'
      });

      // Add rule to handle binary files
      const wasmExtensionRegExp = /\.wasm$/;
      webpackConfig.resolve.extensions.push('.wasm');
      webpackConfig.module.rules.forEach((rule) => {
        (rule.oneOf || []).forEach((oneOf) => {
          if (oneOf.loader && oneOf.loader.indexOf('file-loader') >= 0) {
            oneOf.exclude.push(wasmExtensionRegExp);
          }
        });
      });

      // Ensure ONNX Runtime can be loaded
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        fs: false,
        path: false,
        crypto: false
      };
      
      return webpackConfig;
    }
  }
}; 