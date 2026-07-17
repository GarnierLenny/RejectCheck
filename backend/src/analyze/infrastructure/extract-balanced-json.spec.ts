import { extractBalancedJson } from './anthropic-claude.provider';

describe('extractBalancedJson (streamed tool-input recovery)', () => {
  it('parses clean JSON', () => {
    expect(extractBalancedJson('{"a":1,"b":"x"}')).toEqual({ a: 1, b: 'x' });
  });

  it('tolerates trailing non-whitespace after the object (the prod bug)', () => {
    expect(extractBalancedJson('{"a":1}x')).toEqual({ a: 1 });
    expect(extractBalancedJson('{"a":{"b":2}} garbage 123')).toEqual({ a: { b: 2 } });
  });

  it('takes the FIRST object when two are concatenated', () => {
    expect(extractBalancedJson('{"a":1}{"a":2}')).toEqual({ a: 1 });
  });

  it('ignores braces inside strings', () => {
    expect(extractBalancedJson('{"a":"}{"}extra')).toEqual({ a: '}{' });
  });

  it('returns null for a truncated (unbalanced) object', () => {
    expect(extractBalancedJson('{"a":1,"b":')).toBeNull();
  });

  it('returns null when there is no object', () => {
    expect(extractBalancedJson('no json here')).toBeNull();
  });
});
