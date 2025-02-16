/* eslint-disable */
import { beforeAll, describe, expect, it } from "bun:test";
import {
  findAllRoutes,
  PoolData,
  parseMoveAbortError,
  ParsedMoveAbort,
} from "../src";

export function test() {
  describe("test error handler", () => {
    it("parse move abort err", async () => {
      const errorMsg =
        'MoveAbort(MoveLocation { module: ModuleId { address: 4329c86552c182dd08fc203456622f91b52a2b1948daebe9d5efe38ce77a430b, name: Identifier("pool") }, function: 7, instruction: 64, function_name: Some("swap") }, 3) in command 6';

      const parsedErr = parseMoveAbortError(errorMsg) as ParsedMoveAbort;

      expect(parsedErr?.location.module.name).toBe("pool");
      expect(parsedErr?.location.functionName).toBe("swap");
      expect(parsedErr?.errorInfo.tag).toBe("ESwapExceedsSlippage");
      expect(parsedErr?.errorInfo.msg).toBe(
        "Occurs when the swap amount_out is below the minimum amount out declared",
      );
    });

    it("clips err", async () => {
      const errorMsg =
        'some randome stringMoveAbort(MoveLocation { module: ModuleId { address: 4329c86552c182dd08fc203456622f91b52a2b1948daebe9d5efe38ce77a430b, name: Identifier("pool") }, function: 7, instruction: 64, function_name: Some("swap") }, 3) in command 6';

      const parsedErr = parseMoveAbortError(errorMsg) as ParsedMoveAbort;

      expect(parsedErr?.location.module.name).toBe("pool");
      expect(parsedErr?.location.functionName).toBe("swap");
      expect(parsedErr?.errorInfo.tag).toBe("ESwapExceedsSlippage");
      expect(parsedErr?.errorInfo.msg).toBe(
        "Occurs when the swap amount_out is below the minimum amount out declared",
      );
    });
    it("parse not move abort", async () => {
      const errorMsg = "other error type";

      const parsedErr = parseMoveAbortError(errorMsg) as string;
      expect(parsedErr).toBe("Error is not move abort: other error type");
    });
  });
}
