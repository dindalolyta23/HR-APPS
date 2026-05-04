import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

/**
 * MSW Service Worker for browser environment.
 * Used in development and browser-based testing.
 */
export const worker = setupWorker(...handlers);
