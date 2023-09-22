declare interface Field {
  constructor: {
    name: 'Field';
  };
  db: string;
  table: string;
  name: string;
  type: string;
  length: number;
  string: () => any;
  buffer: () => any;
  geometry: () => any;
}

export { Field };
