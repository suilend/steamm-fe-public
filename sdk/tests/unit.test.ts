/* eslint-disable */
import { beforeAll, describe, expect, it } from "bun:test";
import { findAllRoutes, PoolData } from "../src";

export function test() {
  describe("test swap route finder", () => {
    it("get swap routes (1)", async () => {
      const pools: PoolData[] = [
        { poolId: "0x1", coinTypeA: "A", coinTypeB: "B" },
        { poolId: "0x2", coinTypeA: "A", coinTypeB: "C" },
        { poolId: "0x3", coinTypeA: "A", coinTypeB: "F" },
        { poolId: "0x4", coinTypeA: "B", coinTypeB: "C" },
        { poolId: "0x5", coinTypeA: "B", coinTypeB: "E" },
        { poolId: "0x6", coinTypeA: "C", coinTypeB: "F" },
        { poolId: "0x7", coinTypeA: "F", coinTypeB: "A" },
        { poolId: "0x8", coinTypeA: "F", coinTypeB: "B" },
        { poolId: "0x9", coinTypeA: "F", coinTypeB: "E" },
      ];

      const routes = findAllRoutes("A", "E", pools);
      expect(routes.length).toBe(13);
    });

    it("get swap routes - ordered", async () => {
      const pools = [
        { poolId: "0x1", coinTypeA: "A", coinTypeB: "B" },
        { poolId: "0x2", coinTypeA: "B", coinTypeB: "C" },
        { poolId: "0x3", coinTypeA: "C", coinTypeB: "D" },
      ];

      const routes = findAllRoutes("A", "D", pools);

      expect(routes[0][0].coinTypeA).toBe("A");
      expect(routes[0][0].coinTypeB).toBe("B");
      expect(routes[0][0].a2b).toBe(true);

      expect(routes[0][1].coinTypeA).toBe("B");
      expect(routes[0][1].coinTypeB).toBe("C");
      expect(routes[0][1].a2b).toBe(true);

      expect(routes[0][2].coinTypeA).toBe("C");
      expect(routes[0][2].coinTypeB).toBe("D");
      expect(routes[0][2].a2b).toBe(true);
    });

    it("get swap routes - disordered", async () => {
      const pools = [
        { poolId: "0x1", coinTypeA: "A", coinTypeB: "B" },
        { poolId: "0x2", coinTypeA: "C", coinTypeB: "B" },
        { poolId: "0x3", coinTypeA: "C", coinTypeB: "D" },
      ];

      const routes = findAllRoutes("A", "D", pools);

      expect(routes[0][0].coinTypeA).toBe("A");
      expect(routes[0][0].coinTypeB).toBe("B");
      expect(routes[0][0].a2b).toBe(true);

      expect(routes[0][1].coinTypeA).toBe("C");
      expect(routes[0][1].coinTypeB).toBe("B");
      expect(routes[0][1].a2b).toBe(false);

      expect(routes[0][2].coinTypeA).toBe("C");
      expect(routes[0][2].coinTypeB).toBe("D");
      expect(routes[0][2].a2b).toBe(true);
    });

    it("get swap routes - meme2meme", async () => {
      const pools: PoolData[] = [
        { poolId: "0x1", coinTypeA: "MEME1", coinTypeB: "SUI" },
        { poolId: "0x2", coinTypeA: "MEME2", coinTypeB: "SUI" },
        { poolId: "0x3", coinTypeA: "SUI", coinTypeB: "USDC" },
        { poolId: "0x4", coinTypeA: "SUI", coinTypeB: "USDT" },
        { poolId: "0x5", coinTypeA: "USDC", coinTypeB: "USDT" },
      ];

      const routes = findAllRoutes("MEME1", "MEME2", pools);

      expect(routes.length).toBe(1);

      expect(routes[0][0].coinTypeA).toBe("MEME1");
      expect(routes[0][0].coinTypeB).toBe("SUI");
      expect(routes[0][0].a2b).toBe(true);

      expect(routes[0][1].coinTypeA).toBe("MEME2");
      expect(routes[0][1].coinTypeB).toBe("SUI");
      expect(routes[0][1].a2b).toBe(false);
    });
  });
}
