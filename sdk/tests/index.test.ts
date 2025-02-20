import { describe } from "bun:test";

import { test as baseTest } from "./tests/base.test";
import { test as errTest } from "./tests/err.test";
import { test as lendingTest } from "./tests/lending.test";
import { test as routerTest } from "./tests/router.test";
import { test as routerUnitTest } from "./tests/routerUnit.test";

describe("Test Suite", async () => {
  // Run all tests from teston.test.ts
  await baseTest();
  await routerUnitTest();
  await routerTest();
  await errTest();
  await lendingTest();
});
