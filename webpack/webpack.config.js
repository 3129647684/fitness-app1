const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

const isDevelopment = process.env.NODE_ENV !== 'production';

const esmPackages = [
  'react-native',
  'react-native-web',
  'react-native-gesture-handler',
  'react-native-reanimated',
  'react-native-screens',
  'react-native-safe-area-context',
  'react-native-vector-icons',
  'react-native-svg',
  'react-native-linear-gradient',
  'react-native-share',

  'react-native-document-picker',
  '@react-native-async-storage/async-storage',
  '@react-navigation',
  '@op-engineering/op-sqlite',
  'zustand',
];

const esmPattern = new RegExp(`node_modules[/\\\\](${esmPackages.join('|')})`);

module.exports = {
  entry: path.resolve(__dirname, '..', 'index.js'),
  ignoreWarnings: [
    // TODO: react-native-svg lib/module 内部 transformToRn 缺失导出属上游打包缺陷，不影响运行
    (warning) => warning.moduleName && /react-native-svg.*extractTransform/.test(warning.moduleName),
    // TODO: sql.js 为 UMD 模块，webpack 静态分析不出命名导出，运行时 interop 正常
    (warning) => warning.moduleName && /sql\.js/.test(warning.moduleName),
  ],
  output: {
    path: path.resolve(__dirname, '..', 'dist'),
    filename: isDevelopment ? '[name].js' : '[name].[contenthash].js',
    publicPath: '/',
    clean: true,
  },
  mode: isDevelopment ? 'development' : 'production',
  devtool: isDevelopment ? 'eval-source-map' : 'source-map',
  resolve: {
    alias: {
      'react-native$': 'react-native-web',
      '@': path.resolve(__dirname, '..', 'src'),
      // sql.js exports 字段的 browser 条件解析在 webpack 下异常，显式指向浏览器版
      'sql.js$': path.resolve(__dirname, '..', 'node_modules', 'sql.js', 'dist', 'sql-wasm-browser.js'),
      'react-native-fs$': path.resolve(__dirname, 'stub-native.js'),
      'react-native-share$': path.resolve(__dirname, 'stub-native.js'),
      'react-native-document-picker$': path.resolve(__dirname, 'stub-native.js'),
    },

    extensions: [
      '.web.tsx',
      '.web.ts',
      '.web.jsx',
      '.web.js',
      '.tsx',
      '.ts',
      '.jsx',
      '.js',
      '.json',
    ],
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: (filePath) => {
          // Peggy 生成的 CJS 文件（react-native-svg ESM 目录内），跳过 babel 以保持 CJS 判定
          if (/react-native-svg[\\/]lib[\\/]module[\\/].*[\\/]transformToRn\.js$/.test(filePath)) {
            return true;
          }
          if (esmPattern.test(filePath)) {
            return false;
          }
          return /node_modules/.test(filePath);
        },
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
            plugins: [
              isDevelopment && [require.resolve('react-refresh/babel'), { skipEnvCheck: true }],
            ].filter(Boolean),
          },
        },
        resolve: {
          fullySpecified: false,
        },
      },
      {
        // react-native-svg 的 lib/module(ESM) 目录内混入 Peggy 生成的 CJS 文件（transformToRn.js），
        // 严格 ESM 解析会报错；auto 模式允许 CJS/ESM 共存且保留命名导出分析
        test: /\.js$/,
        include: /node_modules[\\/]react-native-svg/,
        type: 'javascript/auto',
      },
      {
        // sql.js 为 CJS/UMD，强制 auto 类型确保 module.exports 填充
        test: /node_modules[\\/]sql\.js[\\/]/,
        type: 'javascript/auto',
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.wasm$/,
        type: 'asset/resource',
        generator: {
          filename: '[name][ext]',
        },
      },
    ],
  },
  plugins: [
    new webpack.ProvidePlugin({
      // webpack 5 不注入 Node 全局，react-native 系库运行时会访问 process
      process: 'process/browser',
    }),
    new webpack.DefinePlugin({
      __DEV__: JSON.stringify(isDevelopment),
      'process.env.NODE_ENV': JSON.stringify(isDevelopment ? 'development' : 'production'),
      global: 'globalThis',
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'index.html.template'),
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, '..', 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm'),
          to: path.resolve(__dirname, '..', 'dist'),
        },
      ],
    }),
    isDevelopment && new ReactRefreshWebpackPlugin(),
  ].filter(Boolean),
  devServer: {
    port: 8082,
    historyApiFallback: true,
    hot: true,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      // credentialless 同样提供跨源隔离（OPFS 可用），但允许无 CORP 头的第三方脚本
      // （如 TRAE 预览器注入的 previewer-tools）加载，避免 ERR_BLOCKED_BY_RESPONSE
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
    static: {
      directory: path.resolve(__dirname, '..', 'assets'),
      publicPath: '/assets',
    },
  },
};
