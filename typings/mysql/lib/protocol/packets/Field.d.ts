import { Field as TypeCastField } from '../../../lib/parsers/typeCast.js';

// TODO (major version): remove workaround for `Field` compatibility.
declare interface Field extends TypeCastField {}

export { Field };
