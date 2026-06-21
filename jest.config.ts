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
};

export default config;
