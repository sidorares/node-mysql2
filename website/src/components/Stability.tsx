import { FC, JSX } from 'react';
import {
  AlertTriangle,
  Lightbulb,
  LightbulbOff,
  Microscope,
  Package,
  ShieldCheck,
} from 'lucide-react';

export type StabilityProps = {
  /**
   * - `0`: Deprecated
   * - `1`: Experimental
   * - `1.1`: Early Development
   * - `1.2`: Release Candidate
   * - `2`: Stable
   * - `3`: Legacy
   */
  level: 0 | 1 | 1.1 | 1.2 | 2 | 3;
  /**
   * An optional message
   */
  message?: string | JSX.Element;
};

/**
 * **Usage Examples:**
 *
 * ```tsx
 * <Stability level={2} />
 * ```
 *
 * ---
 *
 * ```tsx
 * <Stability level={2} message='An optional message' />
 * ```
 *
 * ---
 *
 * ```tsx
 * <Stability level={2} message={<>An optional message</>} />
 * ```
 */
export const Stability: FC<StabilityProps> = ({ level, message }) => {
  /* eslint-disable @typescript-eslint/indent */
  const styles: Record<
    StabilityProps['level'],
    { title: string; icon: JSX.Element }
    /* eslint-enable @typescript-eslint/indent */
  > = {
    0: {
      title: 'Deprecated',
      icon: <AlertTriangle />,
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
      icon: <Package />,
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
