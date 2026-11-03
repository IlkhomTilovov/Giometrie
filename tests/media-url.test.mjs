import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveUploadedMediaUrl } from '../shared/mediaUrl.ts';

test('legacy About images use the current site uploads path', () => {
  assert.equal(
    resolveUploadedMediaUrl('http://localhost:3001/uploads/site-content/about_hero_image-1790419761424.webp'),
    '/uploads/site-content/about_hero_image-1790419761424.webp',
  );
  assert.equal(
    resolveUploadedMediaUrl('http://127.0.0.1:3001/uploads/site-content/about_story_image.webp?version=2#preview'),
    '/uploads/site-content/about_story_image.webp?version=2#preview',
  );
  assert.equal(resolveUploadedMediaUrl('https://[::1]:3001/uploads/image.webp'), '/uploads/image.webp');
  assert.equal(resolveUploadedMediaUrl('//localhost:3001/uploads/image.webp'), '/uploads/image.webp');
});

test('uploads respect separate API origins and path prefixes', () => {
  for (const source of ['/uploads/image.webp', 'http://localhost:3001/uploads/image.webp']) {
    assert.equal(resolveUploadedMediaUrl(source, 'https://api.example.com/'), 'https://api.example.com/uploads/image.webp');
    assert.equal(resolveUploadedMediaUrl(source, '/backend/'), '/backend/uploads/image.webp');
  }
  const alreadyResolved = 'https://api.example.com/uploads/image.webp';
  assert.equal(resolveUploadedMediaUrl(alreadyResolved, 'https://api.example.com'), alreadyResolved);
});

test('external media, non-upload paths and non-http sources are unchanged', () => {
  const sources = [
    'https://cdn.example.com/uploads/image.webp?signature=123',
    'https://images.unsplash.com/image?w=800',
    'https://localhost.example.com/uploads/image.webp',
    'https://example.com/localhost/uploads/image.webp',
    'http://localhost:3001/images/image.webp',
    'http://user:password@localhost:3001/uploads/image.webp',
    'ftp://localhost/uploads/image.webp',
    '/placeholder.svg',
    'data:image/png;base64,example',
    'blob:https://giometrie.uz/example',
    '',
  ];
  for (const source of sources) {
    assert.equal(resolveUploadedMediaUrl(source, 'https://api.example.com'), source);
  }
});
