declare module 'generate-function' {
  type Formatters = {
    s(value: unknown): string;
    d(value: unknown): string;
    o(value: unknown): string;
  };

  type GeneratedFunction = {
    (format?: string, ...args: unknown[]): GeneratedFunction;
    scope: Record<string, unknown>;
    formats: Formatters;
    sym(name?: string): string;
    property(name: string | number): string;
    property(object: string, name: string | number): string;
    toString(): string;
    toFunction<T = unknown>(scope?: Record<string, unknown>): T;
  };

  type GenerateFunction = {
    (format?: string, ...args: unknown[]): GeneratedFunction;
    formats: Formatters;
  };

  const generateFunction: GenerateFunction;

  export = generateFunction;
}
