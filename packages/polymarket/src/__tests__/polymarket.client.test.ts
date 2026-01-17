import { beforeEach, describe, expect, it, vi } from "vitest";

const getFeeDataMock = vi.fn();
const getCodeMock = vi.fn();
const isApprovedForAllMock = vi.fn();
const setApprovalForAllMock = vi.fn();
const parseUnitsMock = vi.fn();

vi.mock("ethers", () => ({
  ethers: {
    providers: {
      JsonRpcProvider: class {
        rpcUrl: string;
        constructor(rpcUrl: string) {
          this.rpcUrl = rpcUrl;
        }
        getFeeData = getFeeDataMock;
        getCode = getCodeMock;
      },
    },
    Wallet: class {
      address: string;
      constructor(_privateKey: string, _provider: unknown) {
        this.address = "0xwallet";
      }
    },
    Contract: class {
      address: string;
      abi: unknown;
      signer: unknown;
      constructor(address: string, abi: unknown, signer: unknown) {
        this.address = address;
        this.abi = abi;
        this.signer = signer;
      }
      isApprovedForAll = isApprovedForAllMock;
      setApprovalForAll = setApprovalForAllMock;
    },
    utils: {
      parseUnits: parseUnitsMock,
      formatUnits: vi.fn(),
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

import Polymarket from "../index";
import { polymarketExchange } from "../config";

describe("Polymarket", () => {
  beforeEach(() => {
    getFeeDataMock.mockReset();
    getCodeMock.mockReset();
    isApprovedForAllMock.mockReset();
    setApprovalForAllMock.mockReset();
    parseUnitsMock.mockReset();
  });

  it("checks approval status via the CTF contract", async () => {
    isApprovedForAllMock.mockResolvedValue(true);
    const polymarket = new Polymarket({
      rpcUrl: "http://rpc",
      privateKey: "0xkey",
    });
    await expect(polymarket.isApproved()).resolves.toBe(true);
    expect(isApprovedForAllMock).toHaveBeenCalledWith(
      "0xwallet",
      polymarketExchange
    );
  });

  it("approves using buffered gas price when fee data provides gasPrice", async () => {
    const divMock = vi.fn().mockReturnValue("scaledGasPrice");
    const mulMock = vi.fn().mockReturnValue({ div: divMock });
    getFeeDataMock.mockResolvedValue({ gasPrice: { mul: mulMock } });
    setApprovalForAllMock.mockResolvedValue({
      wait: vi.fn().mockResolvedValue({ status: 1 }),
    });

    const polymarket = new Polymarket({
      rpcUrl: "http://rpc",
      privateKey: "0xkey",
    });
    vi.spyOn(polymarket, "isApproved").mockResolvedValue(true);

    await expect(polymarket.approvalAll()).resolves.toBe(true);
    expect(mulMock).toHaveBeenCalledWith(150);
    expect(divMock).toHaveBeenCalledWith(100);
    expect(setApprovalForAllMock).toHaveBeenCalledWith(
      polymarketExchange,
      true,
      {
        gasPrice: "scaledGasPrice",
        gasLimit: 100000,
      }
    );
  });

  it("approves using fallback gas price when fee data is missing", async () => {
    parseUnitsMock.mockReturnValue("fallbackGas");
    getFeeDataMock.mockResolvedValue({ gasPrice: null });
    setApprovalForAllMock.mockResolvedValue({
      wait: vi.fn().mockResolvedValue({ status: 1 }),
    });

    const polymarket = new Polymarket({
      rpcUrl: "http://rpc",
      privateKey: "0xkey",
    });
    vi.spyOn(polymarket, "isApproved").mockResolvedValue(true);

    await polymarket.approvalAll();
    expect(parseUnitsMock).toHaveBeenCalledWith("50", "gwei");
    expect(setApprovalForAllMock).toHaveBeenCalledWith(
      polymarketExchange,
      true,
      {
        gasPrice: "fallbackGas",
        gasLimit: 100000,
      }
    );
  });

  it("posts market orders through the CLOB client", async () => {
    const polymarket = new Polymarket({
      rpcUrl: "http://rpc",
      privateKey: "0xkey",
    });

    const client = {
      createMarketOrder: vi.fn().mockResolvedValue("signedOrder"),
      postOrder: vi.fn().mockResolvedValue("tx"),
    };
    (polymarket as unknown as { client: typeof client }).client = client;

    const order = {
      market: "0xmarket",
      side: "YES",
      size: "1",
      price: "0.5",
    };

    await polymarket.postOrder(order, { tickSize: "0.01" });
    expect(client.createMarketOrder).toHaveBeenCalledWith(order, {
      tickSize: "0.01",
    });
    expect(client.postOrder).toHaveBeenCalledWith("signedOrder", "FOK");
  });
});
