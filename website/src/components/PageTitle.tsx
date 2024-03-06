import { FC } from 'react';
import Head from '@docusaurus/Head';

export type PageTitleProps = {
  title: string;
};

/**
 * **Force a custom Tab Title:** this component sets a specific title for the browser tab.
 *
 * Use it to override the default title derived from the document or page content.
 *
 * ℹ️ Ideal for situations where the tab title needs to be different from the page's main heading or `.mdx` title.
 *
 * ---
 *
 * **Usage:**
 *
 * ```tsx
 * <PageTitle title='Custom Browser Tab Title' />
 * ```
 */
export const PageTitle: FC<PageTitleProps> = ({ title }) => {
  return (
    <Head>
      <title>{title}</title>
    </Head>
  );
};
