import { beforeAll, describe, expect, it } from "bun:test";

import { test as routerTest } from "./router.test";
import { test as testonTest } from "./teston.test";
import { test as unitTest } from "./unit.test";

describe("Test Suite", () => {
  // Run all tests from teston.test.ts
  // testonTest();
  // unitTest();
  routerTest();
  // Add more test imports and calls here
  // import { test as anotherTest } from './another.test';
  // anotherTest();
});
