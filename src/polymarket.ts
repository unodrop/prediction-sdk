/**
 * Polymarket integration module
 * 
 * This module provides a client for interacting with Polymarket,
 * a decentralized prediction market platform built on Polygon.
 * 
 * Features:
 * - Create and post market orders
 * - Manage token approvals for trading
 * - Support for both EOA and Gnosis Safe wallets
 */

import {
  ApiKeyCreds,
  ClobClient,
  CreateOrderOptions,
  getContractConfig,
  OrderType,
  UserMarketOrder,
} from "@polymarket/clob-client";
import { SignatureType } from "@polymarket/order-utils";
import { ethers } from "ethers";
import {
  CTF_ABI,
  CLobHttpUrl,
  polygonChainId,
  polymarketExchange,
} from "./config";
import { PolymarketOptions } from "./types";

/**
 * Conditional Token Framework contract address for Polygon
 * This contract is used to manage conditional tokens (market shares)
 */
export const CTFContract = getContractConfig(polygonChainId).conditionalTokens;

/**
 * Polymarket client class
 * 
 * Provides methods to interact with Polymarket prediction markets,
 * including creating orders, managing approvals, and handling transactions.
 * 
 * @example
 * ```typescript
 * const polymarket = new Polymarket({
 *   rpcUrl: "https://polygon-rpc.com",
 *   privateKey: "0x...",
 * });
 * 
 * await polymarket.createClient();
 * await polymarket.approvalAll();
 * await polymarket.postOrder(order);
 * ```
 */
export default class Polymarket {
  /** Configuration options for the Polymarket client */
  private options: PolymarketOptions;

  /** Ethers.js provider for blockchain interactions */
  private provider: ethers.providers.JsonRpcProvider;

  /** Wallet signer for transaction signing */
  private signer: ethers.Wallet;

  /** Conditional Token Framework contract instance */
  private ctfContract: ethers.Contract;

  /** Polymarket CLOB client instance */
  private client!: ClobClient;

  /**
   * Creates a new Polymarket client instance
   * 
   * @param options - Configuration options including RPC URL and private key
   * @throws {Error} If the private key or RPC URL is invalid
   */
  constructor(options: PolymarketOptions) {
    this.options = options;
    this.options.cLobHttpUrl = options.cLobHttpUrl ?? CLobHttpUrl;
    this.provider = new ethers.providers.JsonRpcProvider(options.rpcUrl);
    this.signer = new ethers.Wallet(options.privateKey, this.provider);
    this.ctfContract = new ethers.Contract(CTFContract, CTF_ABI, this.signer);
  }

  /**
   * Creates and initializes the CLOB client
   * 
   * Automatically detects if the wallet is a Gnosis Safe proxy or EOA,
   * and configures the appropriate signature type.
   * 
   * @returns {Promise<ClobClient>} The initialized CLOB client
   * @throws {Error} If client creation fails
   */
  async createClient(): Promise<ClobClient> {
    const address = this.signer.address;
    const code = await this.provider.getCode(address);
    const isProxySafe = code !== "0x";
    const signatureType = isProxySafe
      ? SignatureType.POLY_GNOSIS_SAFE
      : SignatureType.EOA;
    const apiKeyCreds = await this.client.createOrDeriveApiKey();
    this.client = new ClobClient(
      this.options.cLobHttpUrl!,
      polygonChainId,
      this.signer,
      apiKeyCreds,
      signatureType,
      isProxySafe ? address : undefined
    );
    return this.client;
  }

  /**
   * Posts a market order to Polymarket
   * 
   * Creates a signed market order and submits it to the order book
   * using Fill-or-Kill (FOK) order type.
   * 
   * @param {UserMarketOrder} userMarketOrder - The market order to post
   * @param {Partial<CreateOrderOptions>} [options] - Optional order creation options
   * @returns {Promise<void>} Promise that resolves when the order is posted
   * @throws {Error} If order creation or posting fails
   * 
   * @example
   * ```typescript
   * await polymarket.postOrder({
   *   market: "0x...",
   *   side: "YES",
   *   size: "1000000000",
   *   price: "0.5"
   * });
   * ```
   */
  async postOrder(
    userMarketOrder: UserMarketOrder,
    options?: Partial<CreateOrderOptions>
  ): Promise<void> {
    const signedOrder = await this.client.createMarketOrder(
      userMarketOrder,
      options
    );
    const tx = await this.client.postOrder(signedOrder, OrderType.FOK);
    return tx;
  }

  /**
   * Checks if the exchange contract is approved to manage tokens
   * 
   * This checks if setApprovalForAll has been called for the Polymarket
   * exchange contract, which is required before trading.
   * 
   * @returns {Promise<boolean>} True if approved, false otherwise
   */
  isApproved(): Promise<boolean> {
    return this.ctfContract.isApprovedForAll(
      this.signer.address,
      polymarketExchange as `0x${string}`
    );
  }

  /**
   * Approves the Polymarket exchange to manage all tokens
   * 
   * This is a one-time operation that allows the exchange contract
   * to transfer conditional tokens on your behalf. Required before trading.
   * 
   * Uses a 50% gas price buffer to ensure transaction confirmation.
   * 
   * @returns {Promise<boolean>} True if approval succeeds
   * @throws {Error} If the approval transaction fails or is not confirmed
   * 
   * @example
   * ```typescript
   * const isApproved = await polymarket.isApproved();
   * if (!isApproved) {
   *   await polymarket.approvalAll();
   * }
   * ```
   */
  async approvalAll() {
    const feeData = await this.provider.getFeeData();
    const gasPrice = feeData.gasPrice
      ? feeData.gasPrice.mul(150).div(100)
      : ethers.utils.parseUnits("50", "gwei");
    const tx = await this.ctfContract.setApprovalForAll(
      polymarketExchange,
      true,
      {
        gasPrice: gasPrice,
        gasLimit: 100000,
      }
    );
    const receipt = await tx.wait();
    if (receipt.status === 1 && (await this.isApproved())) return true;
    throw new Error("Approval failed");
  }

  //   async checkBalance(symbol: "USDC" | "MATIC"): Promise<number> {
  //     return this.provider.getBalance(this.signer.address);
  //   }
}

/**
 * Formats a raw token amount to a human-readable decimal amount
 * 
 * Converts a raw amount (as a string) from the smallest unit to a decimal
 * representation using the specified number of decimals.
 * 
 * @param {string} raw - The raw amount as a string (e.g., "1000000000" for 1 token with 9 decimals)
 * @param {number} decimals - The number of decimals the token uses (e.g., 6 for USDC, 18 for ETH)
 * @returns {string} The formatted amount as a decimal string (e.g., "1.0")
 * 
 * @example
 * ```typescript
 * formatClobAmount("1000000", 6); // Returns "1.0" (for USDC)
 * formatClobAmount("1000000000000000000", 18); // Returns "1.0" (for ETH)
 * ```
 */
export const formatClobAmount = (raw: string, decimals: number): string =>
  ethers.utils.formatUnits(raw, decimals);

/**
 * Determines if a wallet address is a Gnosis Safe (smart contract wallet)
 * 
 * Checks if an address has deployed contract code. If the code is not "0x",
 * it means the address is a contract, which in the context of Polymarket
 * typically indicates a Gnosis Safe proxy wallet.
 * 
 * This is important because Gnosis Safe wallets require a different signature
 * type (POLY_GNOSIS_SAFE) compared to regular EOA wallets.
 * 
 * @param {string} address - The Ethereum address to check
 * @param {string} rpcUrl - The RPC endpoint URL to query the blockchain
 * @returns {Promise<boolean>} True if the address is a contract (likely Gnosis Safe), false if it's an EOA
 * 
 * @example
 * ```typescript
 * const isSafe = await isGnosisSafe("0x...", "https://polygon-rpc.com");
 * if (isSafe) {
 *   // Use POLY_GNOSIS_SAFE signature type
 * }
 * ```
 */
export const isGnosisSafe = async (
  address: string,
  rpcUrl: string
): Promise<boolean> => {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const code = await provider.getCode(address);
  return code !== "0x";
};
