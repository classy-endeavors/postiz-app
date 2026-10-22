/** Jest config for email provider unit tests (root jest.config.ts needs @nx/jest). */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src/emails', '<rootDir>/src/services'],
  testMatch: ['**/*.spec.ts'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'commonjs',
          esModuleInterop: true,
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
          strict: false,
          skipLibCheck: true,
        },
      },
    ],
  },
  moduleNameMapper: {
    '^@gitroom/nestjs-libraries/(.*)$': '<rootDir>/src/$1',
    '^@gitroom/helpers/(.*)$': '<rootDir>/../helpers/src/$1',
  },
};
