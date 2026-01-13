/**
 * Type definitions for prediction market platforms
 * 
 * This module contains TypeScript interfaces and types used across
 * the prediction SDK for various market platforms.
 */

/**
 * Configuration options for Polymarket client initialization
 * 
 * @interface PolymarketOptions
 * @property {string} rpcUrl - Polygon RPC endpoint URL for blockchain interactions
 * @property {string} privateKey - Private key of the wallet to use for signing transactions
 * @property {string} [cLobHttpUrl] - Optional CLOB API endpoint URL (defaults to https://clob.polymarket.com)
 */
export interface PolymarketOptions {
  /** Polygon RPC endpoint URL for blockchain interactions */
  rpcUrl: string;
  /** Private key of the wallet to use for signing transactions */
  privateKey: string;
  /** Optional CLOB API endpoint URL (defaults to https://clob.polymarket.com) */
  cLobHttpUrl?: string;
}