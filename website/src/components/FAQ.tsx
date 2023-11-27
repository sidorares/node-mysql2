import { FC, ReactNode } from 'react';
// eslint-disable-next-line import/no-unresolved
import Details from '@theme/Details';

export type FAQProps = {
  children: ReactNode;
  open?: boolean;
  title: string;
};

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
