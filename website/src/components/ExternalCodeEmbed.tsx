import { useState, useEffect, FC } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
// eslint-disable-next-line import/no-unresolved
import CodeBlock from '@theme/CodeBlock';
import { Loading } from '@site/src/components/Loading';
import {
  MethodType,
  extractMethodContent,
} from '@site/helpers/extract-method-content';

export type ExternalCodeEmbedProps = {
  /** Raw URL from GitHub */
  url: string;
  /** `js`, `ts`, `json`, etc. */
  language: string;
  extractMethod?: string;
  methodType?: MethodType;
};

/**
 * Experimental
 *
 *
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
  extractMethod,
  methodType,
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
        const extractedCode =
          extractMethod && methodType
            ? extractMethodContent(text, extractMethod, methodType)
            : text;

        setCode(extractedCode || text);
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
  }, [finalURL, extractMethod, methodType]);

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
