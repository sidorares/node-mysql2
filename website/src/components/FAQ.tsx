import type { FC, ReactNode } from 'react';
import Details from '@theme/Details';

export type FAQProps = {
  children: ReactNode;
  open?: boolean;
  title: string;
};

/**
 * Usage example:
 *
 * ```mdx
 * <FAQ title='Title'>
 *
 * > Some markdown (**MDX**) content.
 *
 * </FAQ>
 * ```
 */
export const FAQ: FC<FAQProps> = ({ children, open, title }) => {
  return (
    <Details
      open={open}
      className='faq'
      summary={
        <summary>
          <strong>{title}</strong>
        </summary>
      }
    >
      <section>{children}</section>
    </Details>
  );
};
