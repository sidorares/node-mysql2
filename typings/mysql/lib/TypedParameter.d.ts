/**
 * A bind parameter carrying an explicit MySQL type.
 *
 * Produced by the `TypedParameter` factories and accepted anywhere
 * `execute()` takes a value. The declared type is sent verbatim in
 * `COM_STMT_EXECUTE` instead of being inferred from the JavaScript type.
 */
export interface TypedParameterValue {
  readonly type: number;
  readonly value: unknown;
  readonly unsigned: boolean;
}

export type TypedParameterInput =
  string | number | bigint | boolean | Date | Buffer | Uint8Array | null;

export interface TypedParameterFactory {
  (value: TypedParameterInput): TypedParameterValue;
}

export interface IntegerTypedParameterFactory extends TypedParameterFactory {
  unsigned(value: TypedParameterInput): TypedParameterValue;
}

export interface JsonTypedParameterFactory {
  (value: TypedParameterInput | object): TypedParameterValue;
}

export interface TypedParameter {
  TINY: IntegerTypedParameterFactory;
  SHORT: IntegerTypedParameterFactory;
  YEAR: IntegerTypedParameterFactory;
  INT24: IntegerTypedParameterFactory;
  LONG: IntegerTypedParameterFactory;
  LONGLONG: IntegerTypedParameterFactory;

  TINYINT: IntegerTypedParameterFactory;
  SMALLINT: IntegerTypedParameterFactory;
  MEDIUMINT: IntegerTypedParameterFactory;
  INT: IntegerTypedParameterFactory;
  INTEGER: IntegerTypedParameterFactory;
  BIGINT: IntegerTypedParameterFactory;

  FLOAT: TypedParameterFactory;
  DOUBLE: TypedParameterFactory;
  REAL: TypedParameterFactory;

  DATE: TypedParameterFactory;
  DATETIME: TypedParameterFactory;
  TIMESTAMP: TypedParameterFactory;
  TIME: TypedParameterFactory;

  DECIMAL: TypedParameterFactory;
  NEWDECIMAL: TypedParameterFactory;
  VARCHAR: TypedParameterFactory;
  VAR_STRING: TypedParameterFactory;
  STRING: TypedParameterFactory;
  CHAR: TypedParameterFactory;
  VARBINARY: TypedParameterFactory;
  BINARY: TypedParameterFactory;
  ENUM: TypedParameterFactory;
  SET: TypedParameterFactory;
  BIT: TypedParameterFactory;
  GEOMETRY: TypedParameterFactory;
  VECTOR: TypedParameterFactory;
  TINY_BLOB: TypedParameterFactory;
  MEDIUM_BLOB: TypedParameterFactory;
  LONG_BLOB: TypedParameterFactory;
  BLOB: TypedParameterFactory;
  TEXT: TypedParameterFactory;

  JSON: JsonTypedParameterFactory;

  NULL(): TypedParameterValue;
}

/**
 * Constant `TypedParameter`.
 *
 * Please note that `TypedParameter` can only be accessed from the `mysql` object and not imported directly.
 */
declare const TypedParameter: TypedParameter;

export { TypedParameter };
