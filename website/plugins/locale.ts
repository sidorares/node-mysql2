import type { Plugin } from '@docusaurus/types';

export const navbarLocalePlugin = (): Plugin<void> => {
  return {
    name: 'navbar-locale-plugin',
    async contentLoaded({ actions }) {
      const { setGlobalData } = actions;
      setGlobalData({ currentLocale: process.env.LOCALE });
    },
  };
};

export const useLocale =
  typeof process.env?.LOCALE === 'string' && process.env.LOCALE ? true : false;

export const getLocaleURL = (): string =>
  useLocale ? `/${process.env.LOCALE}/docs` : '/docs';
