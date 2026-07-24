import { escapeHtml } from './email-renderer';

/**
 * The stale-application nudge is the first template to interpolate text the USER
 * typed (job title and company, straight from the tracker) into an email sent
 * from our domain. Without escaping, a crafted company name injects markup and
 * links into mail our users trust.
 */
describe('escapeHtml', () => {
  it('neutralises a script injection in a company name', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;',
    );
  });

  it('neutralises an injected link', () => {
    expect(escapeHtml('Acme<a href="http://evil.test">click</a>')).toBe(
      'Acme&lt;a href=&quot;http://evil.test&quot;&gt;click&lt;/a&gt;',
    );
  });

  it('escapes the ampersand FIRST so escapes are not double-encoded', () => {
    // Naive ordering turns "&" into "&amp;lt;" here.
    expect(escapeHtml('A & B < C')).toBe('A &amp; B &lt; C');
  });

  it('escapes quotes, which matter inside attributes', () => {
    expect(escapeHtml(`"' `.trim())).toBe('&quot;&#39;');
  });

  it('leaves ordinary company and role names untouched', () => {
    expect(escapeHtml('Acme')).toBe('Acme');
    expect(escapeHtml('Senior React Engineer')).toBe('Senior React Engineer');
  });
});
