/**
 * Configuration constants for Polymarket integration
 * 
 * This module contains contract addresses, ABIs, and network configuration
 * used for interacting with Polymarket on Polygon network.
 */

/**
 * USDC contract address on Polygon mainnet
 * This is the USDC.e (bridged USDC) contract address
 */
export const USDCContractAddress = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";

/**
 * USDC ERC20 token ABI
 * Contains the essential functions needed to interact with USDC token:
 * - balanceOf: Check token balance
 * - allowance: Check spending allowance
 * - approve: Approve token spending
 * - decimals: Get token decimals
 */
export const USDC_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
];

/**
 * Polymarket CLOB (Central Limit Order Book) API endpoint
 * This is the base URL for the Polymarket order book API
 */
export const CLobHttpUrl = "https://clob.polymarket.com";

/**
 * Polymarket exchange contract address on Polygon
 * This is the contract that handles order execution on Polymarket
 */
export const polymarketExchange = "0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E";

/**
 * Polygon mainnet chain ID
 * Chain ID 137 is used for Polygon PoS mainnet
 */
export const polygonChainId = 137;

/**
 * CTF (Conditional Token Framework) ABI
 * 
 * The Conditional Token Framework is used by Polymarket to represent
 * conditional tokens (Yes/No shares) for prediction markets.
 * 
 * Functions:
 * - setApprovalForAll: Approve an operator to manage all tokens
 * - isApprovedForAll: Check if an operator is approved
 */
export const CTF_ABI = [
  "function setApprovalForAll(address operator, bool approved) external",
  "function isApprovedForAll(address account, address operator) view returns (bool)",
];



export const SAFE_PROXY_FACTORY_ADDRESS = "0xaacFeEa03eb1561C4e67d661e40682Bd20E3541b";
export const COMPUTE_PROXY_ADDRESS_FUNCTION_SIGNATURE =
  "computeProxyAddress(address)";

export const ERROR_CODES = {
  RPC_REQUEST_FAILED: "RPC_REQUEST_FAILED",
  RPC_RESPONSE_EMPTY: "RPC_RESPONSE_EMPTY",
  RPC_ERROR: "RPC_ERROR",
  RPC_INVALID_RESULT: "RPC_INVALID_RESULT",
} as const;