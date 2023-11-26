import { FC, JSX } from 'react';
import {
  AlertCircle,
  Lightbulb,
  LightbulbOff,
  Microscope,
  ShieldCheck,
} from 'lucide-react';

export type StabilityProps = {
  level: 0 | 1 | 1.1 | 1.2 | 2 | 3;
  message?: string | JSX.Element;
};

export const Stability: FC<StabilityProps> = ({ level, message }) => {
  /* eslint-disable @typescript-eslint/indent */
  const styles: Record<
    StabilityProps['level'],
    { title: string; icon: JSX.Element }
    /* eslint-enable @typescript-eslint/indent */
  > = {
    0: {
      title: 'Deprecated',
      icon: <AlertCircle />,
    },
    1: {
      title: 'Experimental',
      icon: <Microscope />,
    },
    1.1: {
      title: 'Early Development',
      icon: <Lightbulb />,
    },
    1.2: {
      title: 'Release Candidate',
      icon: <Lightbulb />,
    },
    2: {
      title: 'Stable',
      icon: <ShieldCheck />,
    },
    3: {
      title: 'Legacy',
      icon: <LightbulbOff />,
    },
  };

  return (
    <section className='stability' data-level={level}>
      <header>
        <strong>{level}</strong>
        <span>{styles[level].title}</span>
        {styles[level].icon}
      </header>
      {message ? <p>{message}</p> : null}
    </section>
  );
};
