// tests/transformer/type-analysis.test.ts

import { analyzeFunctionTypes } from '../../build/type-analyzer';

describe('analyzeFunctionTypes', () => {
  it('analyse les paramètres et le type de retour d’une fonction TypeScript', () => {
    const code = `
      function multiply(a: number, b: number): number {
        return a * b;
      }
    `;
    const result = analyzeFunctionTypes(code);
    expect(result.params).toEqual([
      { name: 'a', type: 'number' },
      { name: 'b', type: 'number' }
    ]);
    expect(result.returns).toBe('number');
  });
});