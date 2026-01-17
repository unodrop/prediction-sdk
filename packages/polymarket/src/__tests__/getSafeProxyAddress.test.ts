import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const idMock = vi.fn();
const fetchMock = vi.fn();

vi.mock("ethers", () => ({
  ethers: {
    providers: {
      JsonRpcProvider: class {},
    },
    Wallet: class {},
    Contract: class {},
    utils: {
      formatUnits: vi.fn(),
      parseUnits: vi.fn(),
      id: idMock,
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

import { getSafeProxyAddress } from "../index";

describe("getSafeProxyAddress", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    idMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("computes the safe proxy address via eth_call", async () => {
    idMock.mockReturnValue(
      "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    );

    const ownerAddress = "0xAbC0000000000000000000000000000000000DeF";
    const rpcResponse = {
      jsonrpc: "2.0",
      result:
        "0x0000000000000000000000001111222233334444555566667777888899990000",
      id: 1,
    };

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => rpcResponse,
    });

    await expect(
      getSafeProxyAddress("https://rpc.example", ownerAddress)
    ).resolves.toBe("0x1111222233334444555566667777888899990000");

    const expectedData =
      "0x12345678" +
      "abc0000000000000000000000000000000000def".padStart(64, "0");

    expect(fetchMock).toHaveBeenCalledWith("https://rpc.example", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_call",
        params: [
          {
            to: "0xaacFeEa03eb1561C4e67d661e40682Bd20E3541b",
            data: expectedData,
          },
          "latest",
        ],
        id: 1,
      }),
    });
  });

  it("throws when rpc returns an error", async () => {
    idMock.mockReturnValue(
      "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    );

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        jsonrpc: "2.0",
        error: { code: -32000, message: "error" },
        id: 1,
      }),
    });

    await expect(
      getSafeProxyAddress("https://rpc.example", "0xabc")
    ).rejects.toThrow("RPC_ERROR:-32000");
  });
});
