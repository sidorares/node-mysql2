// TODO (major version): remove workaround for `Field` compatibility.
import { Field as TypeCastField } from '../../../lib/parsers/typeCast.js';

/**
 * @deprecated
 * `Field` is deprecated and might be removed in the future major release. Please use `TypeCastField` property instead.
 */
declare interface Field extends TypeCastField {}

export { Field };
