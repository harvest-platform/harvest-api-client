var webpack = require('webpack');
var path = require('path');

var UglifyJsPlugin = webpack.optimize.UglifyJsPlugin;
var env = process.env.WEBPACK_ENV;

var libraryName = 'harvest';
var plugins = [];

if (env === 'build') {
  plugins.push(new UglifyJsPlugin({
    minimize: true,
    sourceMap: true
  }));
  outputPath = __dirname + '/dist';
  outputFile = libraryName + '.min.js';
} else {
  outputPath = __dirname + '/lib';
  outputFile = libraryName + '.js';
}

var config = {
  entry: __dirname + '/src/index.js',

  devtool: 'source-map',

  output: {
    path: outputPath,
    filename: outputFile,
    library: libraryName,
    libraryTarget: 'umd',
    umdNamedDefine: true
  },

  module: {
    rules: [
      {
        test: /(\.jsx|\.js)$/,
        loader: 'babel-loader',
        exclude: /(node_modules|bower_components)/
      },
      {
        test: /(\.jsx|\.js)$/,
        loader: "eslint-loader",
        exclude: /node_modules/
      }
    ]
  },

  resolve: {
    enforceExtension: false,
    modules: [
      path.resolve('./src'),
      "node_modules"
    ]
  },

  plugins: plugins
};

module.exports = config;
