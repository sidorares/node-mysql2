import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Quickstart',
  url: 'https://sidorares.github.io/',
  baseUrl: '/node-mysql2/',
  organizationName: 'sidorares',
  projectName: 'node-mysql2',
  trailingSlash: false,
  // favicon: 'img/favicon.ico',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
        {
          docs: {
            sidebarPath: './sidebars.ts',
            editUrl: 'https://github.com/sidorares/node-mysql2/tree/master/website/docs',
          },
          theme: {
            customCss: './src/css/custom.scss',
          },
          blog: false,
        } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // image: 'img/mysql2-social-card.jpg',
    navbar: {
      title: 'MySQL2',
      // logo: {
      //    alt: 'MySQL2 Logo',
      //    src: 'img/logo.svg',
      // },
      items: [
        {
          to: '/docs/examples',
          label: 'Examples',
          position: 'left',
        },
        // {
        //    to: '/docs/faq',
        //    label: 'FAQ',
        //    position: 'left',
        // },
        {
          href: 'https://stackoverflow.com/questions/tagged/mysql2',
          label: 'Stack Overflow',
          position: 'right',
        },
        {
          href: 'https://github.com/sidorares/node-mysql2',
          label: 'GitHub',
          position: 'right',
        },
        { type: 'search', position: 'right' },
      ],
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,

  plugins: ['docusaurus-plugin-sass', '@easyops-cn/docusaurus-search-local'],
};

export default config;
