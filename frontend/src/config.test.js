import { describe, it, expect } from 'vitest';
import { API_BASE_URL } from './config';

describe('config', () => {
  it('should have API_BASE_URL defined', () => {
    expect(API_BASE_URL).toBeTruthy();
    expect(typeof API_BASE_URL).toBe('string');
  });
});
