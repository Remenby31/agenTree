export default {
  title: 'AgenTree',
  description: 'Hierarchical AI agents for TypeScript',
  
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API Reference', link: '/api/agent' },
      { text: 'Examples', link: '/examples/' },
      { text: 'GitHub', link: 'https://github.com/Remenby31/agentree' }
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Core Concepts', link: '/guide/core-concepts' },
            { text: 'Quick Examples', link: '/guide/examples' }
          ]
        },
        {
          text: 'Advanced',
          items: [
            { text: 'Custom Tools', link: '/guide/custom-tools' },
            { text: 'Monitoring', link: '/guide/monitoring' },
            { text: 'Configuration', link: '/guide/configuration' }
          ]
        }
      ],

      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Agent', link: '/api/agent' },
            { text: 'Tools', link: '/api/tools' },
            { text: 'Events', link: '/api/events' },
            { text: 'Types', link: '/api/types' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/Remenby31/agentree' },
      { icon: 'npm', link: 'https://www.npmjs.com/package/agentree' }
    ]
  }
}
