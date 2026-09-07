declare module 'named-placeholders' {
  type CompiledQuery = [sql: string, values: unknown[]];

  type QueryCache = {
    get(query: string): unknown;
    set(query: string, tree: unknown): unknown;
  };

  type CompilerOptions = {
    placeholder?: string;
    cache?: number | QueryCache | false;
  };

  type Compile = (
    query: string,
    params?: Record<string, unknown>
  ) => CompiledQuery;

  type CreateCompiler = {
    (options?: CompilerOptions): Compile;
    toNumbered(query: string, params: Record<string, unknown>): CompiledQuery;
  };

  const createCompiler: CreateCompiler;

  export = createCompiler;
}
