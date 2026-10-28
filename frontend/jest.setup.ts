import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';

// react-router uses TextEncoder/TextDecoder, which jsdom does not provide
Object.assign(globalThis, { TextEncoder, TextDecoder });

import fetchMock from 'jest-fetch-mock';

jest.mock('./src/utils/Env', () => ({
  getEnv: () => ({
    API_BASE_URL: 'other',
    MEDIA_BASE_URL: 'development',
  }),
}));

fetchMock.enableMocks();
