import { Redirect } from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

function Home() {
  const { i18n, siteConfig } = useDocusaurusContext();
  const { baseUrl } = siteConfig;
  const currentLocale = i18n.currentLocale;
  const setLocaleRedirectMap = () =>
    currentLocale === 'en' || baseUrl.includes(currentLocale)
      ? `${baseUrl}docs`
      : `${baseUrl}${currentLocale}/docs`;
  const redirectUrl = setLocaleRedirectMap();

  return <Redirect to={redirectUrl} />;
}

export default Home;
