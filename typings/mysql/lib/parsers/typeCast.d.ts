type Geometry = {
  x: number;
  y: number;
};

type Type = {
  type:
    | 'DECIMAL'
    | 'TINY'
    | 'SHORT'
    | 'LONG'
    | 'FLOAT'
    | 'DOUBLE'
    | 'NULL'
    | 'TIMESTAMP'
    | 'TIMESTAMP2'
    | 'LONGLONG'
    | 'INT24'
    | 'DATE'
    | 'TIME'
    | 'TIME2'
    | 'DATETIME'
    | 'DATETIME2'
    | 'YEAR'
    | 'NEWDATE'
    | 'VARCHAR'
    | 'BIT'
    | 'JSON'
    | 'NEWDECIMAL'
    | 'ENUM'
    | 'SET'
    | 'TINY_BLOB'
    | 'MEDIUM_BLOB'
    | 'LONG_BLOB'
    | 'BLOB'
    | 'VAR_STRING'
    | 'STRING'
    | 'GEOMETRY';
};

type Field = Type & {
  length: number;
  db: string;
  table: string;
  name: string;
  string: () => string | null;
  buffer: () => Buffer | null;
  geometry: () => Geometry | Geometry[] | null;
};

type Next = () => void;

export type TypeCast = ((field: Field, next: Next) => any) | boolean;
