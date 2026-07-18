import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Wingport',
  description: 'Open-source AI layer for Flutter apps.',
  base: '/',
  cleanUrls: true,
  appearance: { initialValue: 'dark' },
  head: [
    ['meta', { name: 'theme-color', content: '#18181b' }],
  ],
  themeConfig: {
    siteTitle: 'Wingport',
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Docs', link: '/' },
      { text: 'GitHub', link: 'https://github.com/hayattofik-01/wingport' },
    ],
    sidebar: [
      {
        text: 'Getting Started',
        collapsed: false,
        items: [
          { text: 'Introduction', link: '/' },
          { text: 'Comparison', link: '/comparison' },
          { text: 'Installation', link: '/installation' },
          { text: 'Basic Usage', link: '/basic-usage' },
          { text: 'FAQ', link: '/faq' },
        ],
      },
      {
        text: 'Concepts',
        collapsed: false,
        items: [
          { text: 'Architecture', link: '/concepts/architecture' },
          { text: 'Gateway Configuration', link: '/concepts/gateway-configuration' },
          { text: 'Authentication', link: '/concepts/authentication' },
          { text: 'Usage & Quotas', link: '/concepts/usage-quotas' },
          { text: 'Providers & Fallback', link: '/concepts/providers-fallback' },
          { text: 'Prompt Templates', link: '/concepts/prompt-templates', badge: { text: 'Planned' } },
          { text: 'Streaming & Resilience', link: '/concepts/streaming-resilience' },
          { text: 'Security Model', link: '/concepts/security-model' },
          { text: 'Database', link: '/concepts/database' },
        ],
      },
      {
        text: 'Dart SDK',
        collapsed: false,
        items: [
          { text: 'Client', link: '/dart-sdk/client' },
          { text: 'Generating Text', link: '/dart-sdk/generating-text' },
          { text: 'Streaming', link: '/dart-sdk/streaming' },
          { text: 'Error Handling', link: '/dart-sdk/error-handling' },
          { text: 'Cancellation & Lifecycle', link: '/dart-sdk/cancellation-lifecycle' },
        ],
      },
      {
        text: 'Providers',
        collapsed: false,
        items: [
          { text: 'Anthropic', link: '/providers/#anthropic' },
          { text: 'OpenAI', link: '/providers/#openai' },
          { text: 'Google', link: '/providers/#google' },
        ],
      },
      {
        text: 'Plugins',
        collapsed: false,
        items: [
          { text: 'Overview', link: '/plugins/' },
          { text: 'Spend Caps', link: '/plugins/#spend-caps' },
          { text: 'Response Caching', link: '/plugins/#response-caching' },
          { text: 'Moderation', link: '/plugins/#moderation' },
          { text: 'Analytics', link: '/plugins/#analytics' },
        ],
      },
      {
        text: 'Deployment',
        collapsed: false,
        items: [
          { text: 'Supabase', link: '/deployment/' },
          { text: 'Firebase', link: '/deployment/#firebase' },
          { text: 'Self-hosted (Dart/Shelf)', link: '/deployment/#self-hosted-dart-shelf' },
          { text: 'Wingport Cloud', link: '/deployment/#wingport-cloud' },
        ],
      },
      {
        text: 'Reference',
        collapsed: false,
        items: [
          { text: 'Gateway HTTP API', link: '/reference/gateway-http-api' },
          { text: 'CLI', link: '/reference/cli' },
          { text: 'Configuration Options', link: '/reference/configuration-options' },
          { text: 'Roadmap', link: '/reference/roadmap' },
        ],
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/hayattofik-01/wingport' },
    ],
    search: {
      provider: 'local',
    },
    outline: {
      level: [2, 3],
    },
  },
})
