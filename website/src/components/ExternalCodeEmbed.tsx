import { useState, useEffect, FC } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
// eslint-disable-next-line import/no-unresolved
import CodeBlock from '@theme/CodeBlock';
import { Loading } from '@site/src/components/Loading';

export type ExternalCodeEmbedProps = {
  /** Raw URL from GitHub */
  url: string;
  /** `js`, `ts`, `json`, etc. */
  language: string;
};

/**
 * **Usage Example:**
 *
 * ```tsx
 * <ExternalCodeEmbed
 *   url='/examples/queries/select.js'
 *   language='js'
 * />
 * ```
 *
 * ---
 *
 * ```tsx
 * <ExternalCodeEmbed
 *   url='https://raw.githubusercontent.com/sidorares/node-mysql2/master/index.js'
 *   language='js'
 * />
 * ```
 */
export const ExternalCodeEmbed: FC<ExternalCodeEmbedProps> = ({
  url,
  language,
}) => {
  const [code, setCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(true);
  const { siteConfig } = useDocusaurusContext();
  const baseUrl = siteConfig.baseUrl.replace(/\/$/, '');
  const finalURL = /^\//.test(url) ? `${baseUrl}${url}` : url;

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    fetch(finalURL, { signal })
      .then((response) => response.text())
      .then((text) => {
        setCode(text);
        setLoading(false);
        setError(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [finalURL]);

  return (
    <>
      {loading ? (
        <Loading />
      ) : (
        <>
          {error ? (
            <div>
              Unable to access the requested link: <code>{finalURL}</code>.
              Please verify the link or try again later.
            </div>
          ) : (
            <CodeBlock className={`language-${language}`}>{code}</CodeBlock>
          )}
        </>
      )}
    </>
  );
};
