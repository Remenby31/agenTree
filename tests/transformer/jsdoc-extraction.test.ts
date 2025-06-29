// tests/transformer/jsdoc-extraction.test.ts

import { extractJSDoc } from '../../build/jsdoc-extractor';

describe('extractJSDoc', () => {
  it('extrait la description et les paramètres JSDoc d’une fonction', () => {
    const code = `
      /**
       * Additionne deux nombres.
       * @param {number} a Le premier nombre.
       * @param {number} b Le second nombre.
       * @returns {number} La somme.
       */
      function add(a, b) { return a + b; }
    `;
    const result = extractJSDoc(code);
    expect(result.description).toContain('Additionne deux nombres');
    expect(result.params).toEqual([
      { name: 'a', type: 'number', description: 'Le premier nombre.' },
      { name: 'b', type: 'number', description: 'Le second nombre.' }
    ]);
    expect(result.returns?.type).toBe('number');
  });
});