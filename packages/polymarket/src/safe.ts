import { ethers } from "ethers";
import { decodeAddress, encodeAddress, getFunctionSelector, getJsonRpcProvider } from "./utils";
import { JsonRpcRequest, JsonRpcResponse } from "./types";
import { ERROR_CODES, COMPUTE_PROXY_ADDRESS_FUNCTION_SIGNATURE, SAFE_PROXY_FACTORY_ADDRESS } from "./config";




// Sends a JSON-RPC request and normalizes transport-level errors.
const postJsonRpc = async (
  rpcUrl: string,
  rpcRequest: JsonRpcRequest
): Promise<JsonRpcResponse> => {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(rpcRequest),
  });

  if (!response.ok) {
    throw new Error(ERROR_CODES.RPC_REQUEST_FAILED);
  }

  try {
    return (await response.json()) as JsonRpcResponse;
  } catch {
    throw new Error(ERROR_CODES.RPC_RESPONSE_EMPTY);
  }
};

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
  const provider = getJsonRpcProvider(rpcUrl);
  const code = await provider.getCode(address);
  return code !== "0x";
};

/**
 * Computes the Gnosis Safe proxy address for a given owner address.
 *
 * @param {string} rpcUrl - The RPC endpoint URL to query the blockchain
 * @param {string} walletAddress - The owner address used to compute the proxy
 * @param options - Optional overrides for factory address and function signature
 * @returns {Promise<string>} The computed Safe proxy address
 */
export const getSafeProxyAddress = async (
  rpcUrl: string,
  walletAddress: string,
  options?: {
    safeProxyFactoryAddress?: string;
    functionSignature?: string;
  }
): Promise<string> => {
  const functionSignature =
    options?.functionSignature || COMPUTE_PROXY_ADDRESS_FUNCTION_SIGNATURE;
  const safeProxyFactoryAddress =
    options?.safeProxyFactoryAddress || SAFE_PROXY_FACTORY_ADDRESS;

  const functionSelector = getFunctionSelector(functionSignature);
  const encodedAddress = encodeAddress(walletAddress);
  const data = functionSelector + encodedAddress;

  // Build eth_call payload for the factory's computeProxyAddress(address).
  const rpcRequest: JsonRpcRequest = {
    jsonrpc: "2.0",
    method: "eth_call",
    params: [
      {
        to: safeProxyFactoryAddress,
        data,
      },
      "latest",
    ],
    id: 1,
  };

  const rpcResponse = await postJsonRpc(rpcUrl, rpcRequest);

  if (rpcResponse.error) {
    throw new Error(`${ERROR_CODES.RPC_ERROR}:${rpcResponse.error.code}`);
  }

  const hexResult = rpcResponse.result;
  if (!hexResult) {
    throw new Error(ERROR_CODES.RPC_INVALID_RESULT);
  }

  return decodeAddress(hexResult);
};
