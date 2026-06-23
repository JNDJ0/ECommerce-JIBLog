import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^.*/config/client$": "<rootDir>/__mocks__/prisma",
  },
  collectCoverage: true,
  collectCoverageFrom: [
    "src/**/*.ts",
    "errors/**/*.ts",
    "utils/**/*.ts",
    "!src/**/*.d.ts",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov"],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '__tests__/helpers/',
  ],
};

export default config;
