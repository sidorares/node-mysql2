'use strict';

function effectiveTypeCast(options, config) {
  if (
    typeof config.typeCast === 'function' &&
    typeof options.typeCast !== 'function'
  ) {
    return config.typeCast;
  }
  return options.typeCast;
}

module.exports = effectiveTypeCast;
