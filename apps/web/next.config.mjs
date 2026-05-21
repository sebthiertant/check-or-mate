/** @type {import('next').NextConfig} */
const config = {
  output: "standalone",
  webpack(webpackConfig) {
    // Enable WASM for sql.js (M4)
    webpackConfig.experiments = {
      ...webpackConfig.experiments,
      asyncWebAssembly: true,
    }
    return webpackConfig
  },
}

export default config
