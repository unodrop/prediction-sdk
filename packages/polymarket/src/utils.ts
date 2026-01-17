import { FetchRequest, JsonRpcProvider, ethers } from "ethers";

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
  ethers.formatUnits(raw, decimals);


// Returns the 4-byte selector for an ABI function signature.
export const getFunctionSelector = (functionSignature: string): string => {
  const hash = ethers.id(functionSignature);
  return hash.slice(0, 10);
};

// ABI-encodes an address as a 32-byte hex string (no 0x prefix).
export const encodeAddress = (address: string): string => {
  const cleanAddress = address.toLowerCase().replace(/^0x/, "");
  return cleanAddress.padStart(64, "0");
};

// Decodes the last 20 bytes of a hex result into an address.
export const decodeAddress = (hexResult: string): string => {
  const cleanHex = hexResult.replace(/^0x/, "");
  const addressHex = cleanHex.slice(-40);
  return `0x${addressHex}`;
};

export const getJsonRpcProvider = (rpcUrl: string): JsonRpcProvider => {
  const req = new FetchRequest(rpcUrl);
  return new JsonRpcProvider(req, undefined, {
    staticNetwork: ethers.Network.from("matic") // 显式指定网络，禁止探测
  });
};
