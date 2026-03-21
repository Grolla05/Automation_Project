import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Estende expect com matchers do Testing Library
expect.extend(matchers);

// Roda limpeza após cada teste
afterEach(() => {
  cleanup();
});
