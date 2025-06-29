// tests/transformer/integration.test.ts

import { transformAndInjectMetadata } from '../../build/transformer';

describe('Transformer intégration', () => {
  it('extrait, génère et injecte les métadonnées dans une fonction', () => {
    const code = `
      /**
       * Soustrait deux nombres.
       * @param {number} a Le premier nombre.
       * @param {number} b Le second nombre.
       * @returns {number} La différence.
       */
      function sub(a: number, b: number): number {
        return a - b;
      }
    `;
    const output = transformAndInjectMetadata(code);
    expect(output).toContain('Soustrait deux nombres');
    expect(output).toContain('a');
    expect(output).toContain('b');
    expect(output).toContain('number');
    expect(output).toContain('metadata');
  });
});