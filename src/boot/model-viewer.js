export default ({ app }) => {
  app.config.compilerOptions.isCustomElement = (tag) => tag === 'model-viewer'
}
