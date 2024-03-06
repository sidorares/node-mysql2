import type { Plugin } from '@docusaurus/types';

export const navbarLocalePlugin = (): Plugin => ({
  name: 'navbar-locale-plugin',
  contentLoaded({ actions }) {
    const { setGlobalData } = actions;
    setGlobalData({ currentLocale: process.env.LOCALE });
  },
});

export const useLocale =
  typeof process.env?.LOCALE === 'string' &&
  process.env.LOCALE.trim().length > 0;

export const getLocaleURL = (): string =>
  useLocale ? `/${process.env.LOCALE}/docs` : '/docs';
