// Import Moralis
import Moralis from "moralis";

// Import the EvmChain dataType
import { EvmChain } from "@moralisweb3/common-evm-utils";

// Add a variable for the api key, address and chain
const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
const address = "replace_me";
const chain = EvmChain.ETHEREUM;
