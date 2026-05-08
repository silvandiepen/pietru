import { describe, it, expect } from 'vitest';
import { renderTemplate } from './template.js';

describe('renderTemplate', () => {
  it('replaces a simple {{variable}} with its value', () => {
    expect(renderTemplate('Hello, {{name}}!', { name: 'World' })).toBe('Hello, World!');
  });

  it('replaces multiple variables', () => {
    const tpl = '{{greeting}}, {{name}}! Welcome to {{place}}.';
    expect(renderTemplate(tpl, { greeting: 'Hi', name: 'Alice', place: 'Wonderland' })).toBe(
      'Hi, Alice! Welcome to Wonderland.',
    );
  });

  it('HTML-escapes double-mustache values', () => {
    const result = renderTemplate('Content: {{content}}', { content: '<script>alert("xss")</script>' });
    expect(result).toBe('Content: &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  });

  it('escapes ampersands in double-mustache', () => {
    expect(renderTemplate('{{val}}', { val: 'foo & bar' })).toBe('foo &amp; bar');
  });

  it('escapes single quotes in double-mustache', () => {
    expect(renderTemplate("{{val}}", { val: "it's fine" })).toBe('it&#39;s fine');
  });

  it('leaves triple-mustache values unescaped', () => {
    const result = renderTemplate('Raw: {{{html}}}', { html: '<b>bold</b>' });
    expect(result).toBe('Raw: <b>bold</b>');
  });

  it('resolves dot-notation paths', () => {
    const data = { user: { name: 'Bob', address: { city: 'NYC' } } };
    expect(renderTemplate('Hi {{user.name}}', data)).toBe('Hi Bob');
    expect(renderTemplate('City: {{user.address.city}}', data)).toBe('City: NYC');
  });

  it('HTML-escapes dot-notation values', () => {
    const data = { user: { bio: '<em>dev</em>' } };
    expect(renderTemplate('{{user.bio}}', data)).toBe('&lt;em&gt;dev&lt;/em&gt;');
  });

  it('leaves triple-mustache dot-notation unescaped', () => {
    const data = { user: { bio: '<em>dev</em>' } };
    expect(renderTemplate('{{{user.bio}}}', data)).toBe('<em>dev</em>');
  });

  it('keeps undefined variables as-is for double mustache', () => {
    expect(renderTemplate('Missing: {{unknown}}', {})).toBe('Missing: {{unknown}}');
  });

  it('keeps undefined variables as-is for triple mustache', () => {
    expect(renderTemplate('Missing: {{{unknown}}}', {})).toBe('Missing: {{{unknown}}}');
  });

  it('handles null and undefined values gracefully', () => {
    expect(renderTemplate('{{val}}', { val: null })).toBe('');
    expect(renderTemplate('{{val}}', { val: undefined })).toBe('{{val}}');
  });

  it('converts non-string values to string', () => {
    expect(renderTemplate('Count: {{count}}', { count: 42 })).toBe('Count: 42');
    expect(renderTemplate('Active: {{active}}', { active: true })).toBe('Active: true');
  });

  it('handles empty data object', () => {
    expect(renderTemplate('No variables here!', {})).toBe('No variables here!');
  });

  it('handles empty template string', () => {
    expect(renderTemplate('', { name: 'test' })).toBe('');
  });

  it('trims whitespace inside mustache delimiters', () => {
    expect(renderTemplate('{{  name  }}', { name: 'Bob' })).toBe('Bob');
    expect(renderTemplate('{{{  html  }}}', { html: '<p>hi</p>' })).toBe('<p>hi</p>');
  });

  it('returns empty string for null/undefined value in escapeHtml', () => {
    expect(renderTemplate('{{val}}', { val: null })).toBe('');
  });

  it('handles partial dot-path where intermediate is null', () => {
    expect(renderTemplate('{{user.name}}', { user: null })).toBe('{{user.name}}');
  });

  it('handles partial dot-path where intermediate is not an object', () => {
    expect(renderTemplate('{{user.name}}', { user: 'string' })).toBe('{{user.name}}');
  });
});
