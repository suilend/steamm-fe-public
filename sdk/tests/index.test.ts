import { test as testonTest } from "./teston.test";
import { describe, it, expect, beforeAll } from "bun:test";

describe("Test Suite", () => {
  // Run all tests from teston.test.ts
  testonTest();

  // Add more test imports and calls here
  // import { test as anotherTest } from './another.test';
  // anotherTest();
});
