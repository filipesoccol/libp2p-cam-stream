module.exports = {
  chainWebpack: config => config.resolve.symlinks(false),
  publicPath: process.env.NODE_ENV === 'production'
    ? '/libp2p-cam-stream/'
    : '/'
}
