import { describe, expect, it, vi } from "vitest";

const formatUnitsMock = vi.fn();

vi.mock("ethers", () => ({
  ethers: {
    providers: {
      JsonRpcProvider: class {},
    },
    Wallet: class {},
    Contract: class {},
    utils: {
      formatUnits: formatUnitsMock,
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

import { formatClobAmount } from "../index";

describe("formatClobAmount", () => {
  it("formats raw amounts using token decimals", () => {
    formatUnitsMock.mockImplementation(
      (raw: string, decimals: number) => `${raw}:${decimals}`
    );

    expect(formatClobAmount("1000000", 6)).toBe("1000000:6");
    expect(formatClobAmount("1000000000000000000", 18)).toBe(
      "1000000000000000000:18"
    );
    expect(formatUnitsMock).toHaveBeenCalledWith("1000000", 6);
  });
});
