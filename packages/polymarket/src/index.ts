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
    ClobClient,
    type CreateOrderOptions,
    getContractConfig,
    OrderType,
    type UserMarketOrder,
} from "@polymarket/clob-client";
import { SignatureType } from "@polymarket/order-utils";
import { Contract, FetchRequest, JsonRpcProvider, Wallet, ethers, formatUnits, parseUnits } from "ethers";
import type { Wallet as V5WalletType } from "@ethersproject/wallet";
import { Wallet as V5Wallet } from "@ethersproject/wallet";
import { JsonRpcProvider as V5JsonRpcProvider } from "@ethersproject/providers";
import { polygonChainId, CLobHttpUrl, CTF_ABI, polymarketExchange } from "./config";
import { PolymarketOptions } from "./types";
import { getJsonRpcProvider } from "./utils";

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
    private provider: JsonRpcProvider;

    /** Wallet signer for transaction signing */
    private signer: Wallet;

    /** CLOB signer for Polymarket SDK (ethers v5) */
    private clobSigner: V5Wallet;

    /** Conditional Token Framework contract instance */
    private ctfContract: Contract;

    /** Polymarket CLOB client instance */
    private client!: ClobClient;

    /** ClobClient signer type (ethers v5 compatibility) */
    private getClobSigner(): V5WalletType | undefined {
        return this.clobSigner;
    }

    /**
     * Creates a new Polymarket client instance
     * 
     * @param options - Configuration options including RPC URL and private key
     * @throws {Error} If the private key or RPC URL is invalid
     */
    constructor(options: PolymarketOptions) {
        this.options = options;
        this.options.cLobHttpUrl = options.cLobHttpUrl ?? CLobHttpUrl;
        this.provider = getJsonRpcProvider(options.rpcUrl);
        this.signer = new Wallet(options.privateKey, this.provider);
        this.clobSigner = new V5Wallet(
            options.privateKey,
            new V5JsonRpcProvider(options.rpcUrl)
        );
        this.ctfContract = new Contract(CTFContract, CTF_ABI, this.signer);
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
        const bootstrapClient = new ClobClient(
            this.options.cLobHttpUrl!,
            polygonChainId,
            this.getClobSigner(),
            undefined,
            signatureType,
            isProxySafe ? address : undefined
        );
        const apiKeyCreds = await bootstrapClient.createOrDeriveApiKey();
        this.client = new ClobClient(
            this.options.cLobHttpUrl!,
            polygonChainId,
            this.getClobSigner(),
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
            ? (feeData.gasPrice * BigInt(150)) / BigInt(100)
            : parseUnits("50", "gwei");
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