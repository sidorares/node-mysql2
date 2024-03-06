import { FC, JSX } from 'react';
// eslint-disable-next-line import/no-unresolved
import Details from '@theme/Details';
import { FileClock as HistoryIcon } from 'lucide-react';

export type HistoryRecords = {
  /** **Examples:**
   *
   * - `3.x`
   * - `3.2.x`
   * - `3.2.6`
   */
  version: string;
  /**
   * Examples:
   *
   * ---
   *
   * - string
   * ```plain
   * Indicate your changes
   * ```
   *
   * ---
   *
   * - JSX
   * ```tsx
   * <>
   *   <code>Method Name</code> and your changes
   * </>
   * ```
   */
  changes: (string | JSX.Element)[];
};

export type HistoryProps = {
  records: HistoryRecords[];
  open?: boolean;
};

/**
 * **Usage Example:**
 *
 * ```tsx
 * <History
 *   records={[
 *     {
 *       version: '3.5.1',
 *       changes: [
 *         // Using strings
 *         'Indicate your changes'
 *         // You also can use JSX Elements
 *         <>
 *           <code>Method Name</code> and your changes
 *         </>,
 *       ],
 *     },
 *   ]}
 * />
 * ```
 */
export const History: FC<HistoryProps> = ({ records, open }) => {
  return (
    <Details
      open={open}
      summary={
        <summary>
          <HistoryIcon /> History
        </summary>
      }
      className='history'
    >
      <table>
        <thead>
          <tr>
            <th>Version</th>
            <th>Changes</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record, index) => (
            <tr key={`record:${index}`}>
              <td>
                <strong>v{record.version.replace(/[^0-9.]/g, '')}</strong>
              </td>
              <td>
                <div className='changes'>
                  {record.changes.map((change, index) => (
                    <section key={`change:${index}`}>{change}</section>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Details>
  );
};
