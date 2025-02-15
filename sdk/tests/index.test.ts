import { beforeAll, describe, expect, it } from "bun:test";

import { test as errTest } from "./err.test";
import { test as routerTest } from "./router.test";
import { test as testonTest } from "./teston.test";
import { test as unitTest } from "./unit.test";

describe("Test Suite", () => {
  // Run all tests from teston.test.ts
  // testonTest();
  // unitTest();
  routerTest();
  // errTest();
});
