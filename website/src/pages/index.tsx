import React from 'react';
import { Redirect } from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

function Home() {
  const { i18n } = useDocusaurusContext();
  const currentLocale = i18n.currentLocale;
  const setLocaleRedirectMap = () =>
    currentLocale === 'en'
      ? '/node-mysql2/docs'
      : `/node-mysql2/${currentLocale}/docs`;
  const redirectUrl = setLocaleRedirectMap();

  return <Redirect to={redirectUrl} />;
}

export default Home;
