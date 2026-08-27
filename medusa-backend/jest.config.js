const { loadEnv } = require("@medusajs/framework/utils")

loadEnv(process.env.NODE_ENV || "test", process.cwd())

const type = process.env.TEST_TYPE

module.exports = {
  transform: {
    "^.+\\.[jt]s$": [
      "@swc/jest",
      {
        jsc: {
          parser: { syntax: "typescript", decorators: true },
          transform: { legacyDecorator: true, decoratorMetadata: true },
        },
      },
    ],
  },
  testEnvironment: "node",
  moduleFileExtensions: ["js", "ts", "json"],
  modulePathIgnorePatterns: ["dist/"],
  testMatch:
    type === "integration:http"
      ? ["**/integration-tests/http/**/*.spec.[jt]s"]
      : type === "integration:modules"
        ? ["**/src/modules/**/__tests__/**/*.[jt]s"]
        : ["**/src/**/__tests__/**/*.unit.spec.[jt]s"],
}
