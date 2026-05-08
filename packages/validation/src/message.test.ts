import { describe, it, expect } from 'vitest';
import { sendMessageSchema } from './message.js';

describe('sendMessageSchema', () => {
  describe('valid payloads', () => {
    it('accepts a message with html, subject, and from', () => {
      const result = sendMessageSchema.safeParse({
        to: 'user@example.com',
        from: 'admin@example.com',
        subject: 'Hello',
        html: '<p>Hello world</p>',
      });
      expect(result.success).toBe(true);
    });

    it('accepts a message with text instead of html', () => {
      const result = sendMessageSchema.safeParse({
        to: 'user@example.com',
        from: 'admin@example.com',
        subject: 'Hello',
        text: 'Plain text body',
      });
      expect(result.success).toBe(true);
    });

    it('accepts a message with both html and text', () => {
      const result = sendMessageSchema.safeParse({
        to: 'user@example.com',
        from: 'admin@example.com',
        subject: 'Hello',
        html: '<p>HTML</p>',
        text: 'Text',
      });
      expect(result.success).toBe(true);
    });

    it('accepts an array of recipients', () => {
      const result = sendMessageSchema.safeParse({
        to: ['a@example.com', 'b@example.com'],
        from: 'admin@example.com',
        subject: 'Hello',
        html: '<p>Hi</p>',
      });
      expect(result.success).toBe(true);
    });

    it('accepts optional cc, bcc, replyTo, and tags', () => {
      const result = sendMessageSchema.safeParse({
        to: 'user@example.com',
        from: 'admin@example.com',
        subject: 'Hello',
        html: '<p>Hi</p>',
        cc: ['cc@example.com'],
        bcc: ['bcc@example.com'],
        replyTo: 'reply@example.com',
        tags: { campaign: 'welcome' },
      });
      expect(result.success).toBe(true);
    });

    it('accepts a template with data (no subject required)', () => {
      const result = sendMessageSchema.safeParse({
        to: 'user@example.com',
        from: 'admin@example.com',
        templateId: 'tpl_abc123',
        data: { name: 'Alice' },
      });
      expect(result.success).toBe(true);
    });

    it('accepts a template with data and explicit subject override', () => {
      const result = sendMessageSchema.safeParse({
        to: 'user@example.com',
        from: 'admin@example.com',
        templateId: 'tpl_abc123',
        subject: 'Custom subject',
        data: { name: 'Alice' },
      });
      expect(result.success).toBe(true);
    });

    it('accepts a template with data and html/text override', () => {
      const result = sendMessageSchema.safeParse({
        to: 'user@example.com',
        from: 'admin@example.com',
        templateId: 'tpl_abc123',
        html: '<p>Override</p>',
        data: { name: 'Alice' },
      });
      expect(result.success).toBe(true);
    });
  });

  describe('invalid payloads', () => {
    it('rejects missing html/text/templateId (no content)', () => {
      const result = sendMessageSchema.safeParse({
        to: 'user@example.com',
        from: 'admin@example.com',
        subject: 'Hello',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toMatch(/html.*text.*templateId/i);
      }
    });

    it('rejects template without data', () => {
      const result = sendMessageSchema.safeParse({
        to: 'user@example.com',
        from: 'admin@example.com',
        templateId: 'tpl_abc123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toMatch(/data must be provided/i);
      }
    });

    it('rejects missing subject without template', () => {
      const result = sendMessageSchema.safeParse({
        to: 'user@example.com',
        from: 'admin@example.com',
        html: '<p>Hi</p>',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toMatch(/subject must be provided/i);
      }
    });

    it('rejects invalid email in to field', () => {
      const result = sendMessageSchema.safeParse({
        to: 'not-an-email',
        from: 'admin@example.com',
        subject: 'Hello',
        html: '<p>Hi</p>',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid email in array of recipients', () => {
      const result = sendMessageSchema.safeParse({
        to: ['valid@example.com', 'bad-email'],
        from: 'admin@example.com',
        subject: 'Hello',
        html: '<p>Hi</p>',
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty from field', () => {
      const result = sendMessageSchema.safeParse({
        to: 'user@example.com',
        from: '',
        subject: 'Hello',
        html: '<p>Hi</p>',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid cc email', () => {
      const result = sendMessageSchema.safeParse({
        to: 'user@example.com',
        from: 'admin@example.com',
        subject: 'Hello',
        html: '<p>Hi</p>',
        cc: ['not-an-email'],
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid bcc email', () => {
      const result = sendMessageSchema.safeParse({
        to: 'user@example.com',
        from: 'admin@example.com',
        subject: 'Hello',
        html: '<p>Hi</p>',
        bcc: ['not-an-email'],
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid replyTo email', () => {
      const result = sendMessageSchema.safeParse({
        to: 'user@example.com',
        from: 'admin@example.com',
        subject: 'Hello',
        html: '<p>Hi</p>',
        replyTo: 'not-an-email',
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty templateId', () => {
      const result = sendMessageSchema.safeParse({
        to: 'user@example.com',
        from: 'admin@example.com',
        templateId: '',
        data: { name: 'Alice' },
      });
      expect(result.success).toBe(false);
    });
  });
});
