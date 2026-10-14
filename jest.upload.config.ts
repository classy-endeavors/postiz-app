import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  roots: [
    '<rootDir>/libraries/nestjs-libraries/src/upload',
    '<rootDir>/libraries/helpers/src/utils',
  ],
  testMatch: [
    '**/upload/**/*.spec.ts',
    '**/humanize.post.error.spec.ts',
  ],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        isolatedModules: true,
        diagnostics: false,
      },
    ],
  },
  moduleNameMapper: {
    '^@gitroom/nestjs-libraries/(.*)$':
      '<rootDir>/libraries/nestjs-libraries/src/$1',
    '^@gitroom/helpers/(.*)$': '<rootDir>/libraries/helpers/src/$1',
  },
  // Avoid pulling the whole monorepo into the transform cache
  transformIgnorePatterns: ['/node_modules/'],
};

export default config;
