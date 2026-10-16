import { createRequire } from 'node:module';
import { describe, it, strict } from 'poku';
import Query from '../../lib/commands/query.js';
import ConnectionConfig from '../../lib/connection_config.js';

const require = createRequire(import.meta.url);
const { supportsGeometryAxisSwap } = require('../../lib/helpers.js');

await describe('swapGeometryAxisOrder is only honoured where ST_X/ST_Y follow the SRS', async () => {
  await it('detects server versions', () => {
    const cases: Array<[string, boolean]> = [
      ['5.7.44', false],
      ['8.0.11', false],
      ['8.0.12', true],
      ['8.4.3-log', true],
      ['9.7.2', true],
      ['5.5.5-10.6.18-MariaDB', false],
      ['11.4.2-MariaDB-ubu2404', false],
      ['13.0.1-MariaDB', false],
      ['not a version', false],
    ];
    for (const [version, expected] of cases) {
      strict.equal(supportsGeometryAxisSwap(version), expected, version);
    }
  });

  await it('turns the option off for queries on unsupported servers', () => {
    const config = new ConnectionConfig({ swapGeometryAxisOrder: true });
    for (const supported of [false, true]) {
      const query = new Query({ sql: 'select 1' }, () => {});
      const connection = {
        config,
        serverCapabilityFlags: 0,
        _geometryAxisSwapSupported: supported,
        writePacket: () => {},
      };
      query.start(null, connection);
      strict.equal(query.options.swapGeometryAxisOrder, supported);
    }
  });
});
