import { Principal } from "@dfinity/principal";
import { icrc1ToLegacyAccountId, getLegacyAccountId } from "./accountUtils";

// Test the account ID conversion with a known example
const testPrincipal = "r27hb-ckxon-xohqv-afcvx-yhemm-xoggl-37dg6-sfyt3-n6jer-ditge-6qe";

console.log("Testing ICRC1 to Legacy Account ID conversion...");

try {
  // Test with the utility function
  const result = getLegacyAccountId(testPrincipal);
  console.log("Principal:", testPrincipal);
  console.log("Legacy Account ID (hex):", result.hex);
  console.log("Legacy Account ID (dashed):", result.dashed);
  
  // Test with the full function
  const owner = Principal.fromText(testPrincipal);
  const fullResult = icrc1ToLegacyAccountId(owner);
  console.log("Full result matches:", result.hex === fullResult.hex);
  
  // Validate the result format
  console.log("Hex length:", result.hex.length, "(should be 64)");
  console.log("Dashed format valid:", /^[0-9a-f]{8}-[0-9a-f]{8}-[0-9a-f]{8}-[0-9a-f]{8}-[0-9a-f]{8}-[0-9a-f]{8}-[0-9a-f]{8}-[0-9a-f]{8}$/.test(result.dashed));
  
} catch (error) {
  console.error("Error testing account ID conversion:", error);
}
