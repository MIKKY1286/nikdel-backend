export default {
  testEnvironment: 'node',
  transform: {}, // Required to support Node's native ES Modules
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'], // Run this file before each test suite
  testTimeout: 10000, // In-memory mongo can sometimes be slow to download on first run
  verbose: true,
  moduleFileExtensions: ['js', 'json', 'node'],
};
