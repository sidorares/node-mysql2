import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import { navbarLocalePlugin, getLocaleURL } from './plugins/locale.js';

const config: Config = {
  title: 'Quickstart',
  url: 'https://sidorares.github.io/',
  baseUrl: '/node-mysql2/',
  organizationName: 'sidorares',
  projectName: 'node-mysql2',
  trailingSlash: false,
  favicon: 'img/favicon.svg',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'throw',
  onBrokenAnchors: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh-CN', 'pt-BR'],
    localeConfigs: {
      en: {
        label: '🇺🇸 English',
      },
      'zh-CN': {
        label: '🇨🇳 简体中文',
      },
      'pt-BR': {
        label: '🇧🇷 Português (Brasil)',
      },
    },
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl:
            'https://github.com/sidorares/node-mysql2/tree/master/website/',
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
      // logo: {
      //    alt: 'MySQL2 Logo',
      //    src: 'img/logo.svg',
      // },
      items: [
        {
          to: getLocaleURL(),
          label: 'MySQL2',
          position: 'left',
          className: 'navbar__brand navbar__manual--title text--truncate',
          activeBaseRegex: `^/$`,
        },
        {
          to: '/docs/documentation',
          label: 'Docs',
          position: 'left',
        },
        {
          to: '/docs/examples',
          label: 'Examples',
          position: 'left',
        },
        {
          to: '/docs/faq',
          label: 'FAQ',
          position: 'left',
        },
        {
          href: 'https://github.com/sidorares/node-mysql2',
          label: 'GitHub',
          position: 'right',
        },
        {
          href: 'https://stackoverflow.com/questions/tagged/mysql2',
          label: 'Stack Overflow',
          position: 'right',
        },
        {
          href: 'https://github.com/sponsors/sidorares',
          label: 'Donate',
          position: 'right',
        },
        { type: 'search', position: 'right' },
        {
          type: 'localeDropdown',
          position: 'right',
        },
      ],
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['json', 'bash', 'tsx'],
    },
  } satisfies Preset.ThemeConfig,

  plugins: [
    'docusaurus-plugin-sass',
    '@easyops-cn/docusaurus-search-local',
    navbarLocalePlugin,
  ],
};

export default config;
