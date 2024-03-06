import { mysql } from '../../index.test.js';

mysql.setMaxParserCache(1000);

// @ts-expect-error: The `max` param is required
mysql.setMaxParserCache();
