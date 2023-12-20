import { FC, JSX } from 'react';
import Link from '@docusaurus/Link';
import {
  AlertTriangle,
  Lightbulb,
  LightbulbOff,
  Microscope,
  PackageSearch,
  PackageCheck,
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
      icon: <Lightbulb />,
    },
    1.1: {
      title: 'Early Development',
      icon: <Microscope />,
    },
    1.2: {
      title: 'Release Candidate',
      icon: <PackageSearch />,
    },
    2: {
      title: 'Stable',
      icon: <PackageCheck />,
    },
    3: {
      title: 'Legacy',
      icon: <LightbulbOff />,
    },
  };

  return (
    <section className='stability' data-level={level}>
      <Link to='/docs/stability-badges'>
        <header>
          <strong>{level}</strong>
          <span>{styles[level].title}</span>
          {styles[level].icon}
        </header>
      </Link>
      {message ? <p>{message}</p> : null}
    </section>
  );
};
