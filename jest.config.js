module.exports = {
  preset: undefined,
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react',
        esModuleInterop: true,
      },
    }],
  },
  collectCoverageFrom: [
    'lib/**/*.ts',
    'lib/**/*.tsx',
    '!lib/**/*.test.ts',
    '!lib/**/*.test.tsx',
  ],
};
