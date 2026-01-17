import { beforeEach, describe, expect, it, vi } from "vitest";

const getCodeMock = vi.fn();
const constructedUrls: string[] = [];

vi.mock("ethers", () => ({
  ethers: {
    providers: {
      JsonRpcProvider: class {
        rpcUrl: string;
        constructor(rpcUrl: string) {
          this.rpcUrl = rpcUrl;
          constructedUrls.push(rpcUrl);
        }
        getCode = getCodeMock;
      },
    },
    utils: {
      formatUnits: vi.fn(),
      parseUnits: vi.fn(),
    },
  },
}));

vi.mock("@polymarket/clob-client", () => ({
  ClobClient: class {},
  OrderType: { FOK: "FOK" },
  getContractConfig: () => ({ conditionalTokens: "0xctf" }),
}));

vi.mock("@polymarket/order-utils", () => ({
  SignatureType: {
    EOA: "EOA",
    POLY_GNOSIS_SAFE: "POLY_GNOSIS_SAFE",
  },
}));

import { isGnosisSafe } from "../index";

describe("isGnosisSafe", () => {
  beforeEach(() => {
    getCodeMock.mockReset();
    constructedUrls.length = 0;
  });

  it("returns false for EOA addresses", async () => {
    getCodeMock.mockResolvedValue("0x");
    await expect(isGnosisSafe("0xabc", "http://rpc")).resolves.toBe(false);
    expect(getCodeMock).toHaveBeenCalledWith("0xabc");
    expect(constructedUrls).toEqual(["http://rpc"]);
  });

  it("returns true for contract addresses", async () => {
    getCodeMock.mockResolvedValue("0x1234");
    await expect(isGnosisSafe("0xdef", "http://rpc")).resolves.toBe(true);
  });
});
