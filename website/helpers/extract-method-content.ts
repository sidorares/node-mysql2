export type MethodType = 'class' | 'interface' | 'type' | 'function' | 'const';

export const extractMethodContent = (
  text: string,
  methodName: string,
  type: MethodType
): string => {
  const lines = text.split('\n');
  const startPattern = `${type} ${methodName}`;

  let insideSegment: boolean = false;
  let depth: number = 0;
  let extractedCode: string = '';

  for (const line of lines) {
    if (line.includes(startPattern)) insideSegment = true;

    if (insideSegment) {
      if (line.includes('{')) depth++;

      extractedCode += line + '\n';

      if (line.includes('}')) {
        depth--;

        if (depth === 0) break;
      }
    }
  }

  return extractedCode.trim() || text;
};
