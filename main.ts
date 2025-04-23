import {
  PublicKey,
  StakeAuthorizationLayout,
  StakeProgram,
  Transaction,
  clusterApiUrl,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { FireblocksConnectionAdapter } from "solana-web3-adapter";



// Configure API key, secret path, vault account IDs and stake accounts
const API_KEY = "00000000-0000-0000-0000-000000000000";
const API_SECRET_PATH = "./fireblocks_secret.key";
const CURRENT_AUTHORITY_VAULT = "2";
const NEW_AUTHORITY_VAULT = "133";
const STAKE_ACCOUNTS = [
  '9BpJAdXfRk4EoavH65BgcjNFdzDMekBJxJ1sm5xB82LC'
];


/**
 * Main function to change stake account authorization
 */
const main = async () => {

  // Create Fireblocks connection adapter for current authority
  const currentAuthorityConnection = await FireblocksConnectionAdapter.create(
    clusterApiUrl("mainnet-beta"),
    {
      apiKey: API_KEY,
      apiSecretPath: API_SECRET_PATH,
      vaultAccountId: CURRENT_AUTHORITY_VAULT,
    }
  );

  // Create Fireblocks connection adapter for new authority
  const newAuthorityConnection = await FireblocksConnectionAdapter.create(
    clusterApiUrl("mainnet-beta"),
    {
      apiKey: API_KEY,
      apiSecretPath: API_SECRET_PATH,
      vaultAccountId: NEW_AUTHORITY_VAULT,
    }
  );


  // Create a Solana transaction object 
  const transaction: Transaction = new Transaction();

  // Get the public keys of the current and new authorities
  const currentAuthorizedPubkey = new PublicKey(
    currentAuthorityConnection.getAccount()
  );
  const newAuthorizedPubkey = new PublicKey(
    newAuthorityConnection.getAccount()
  );

  // Iterate over each stake account and add the authorization change instructions to the transaction
  for (const stakeAccount of STAKE_ACCOUNTS) {
    
    // Add the authorization change instruction (for Stake Authority) to the transaction
    transaction.add(
      StakeProgram.authorize({
        stakePubkey: new PublicKey(stakeAccount), // Stake account public key
        authorizedPubkey: currentAuthorizedPubkey, // Current authority public key
        newAuthorizedPubkey: newAuthorizedPubkey, // New authority public key
        stakeAuthorizationType: StakeAuthorizationLayout.Staker, // Type of authorization to change
      })
    );

    // Add the authorization change instruction (for Withdrawal Authority) to the transaction
    transaction.add(
      StakeProgram.authorize({
        stakePubkey: new PublicKey(stakeAccount), // Stake account public key
        authorizedPubkey: currentAuthorizedPubkey, // Current authority public key
        newAuthorizedPubkey: newAuthorizedPubkey, // New authority public key
        stakeAuthorizationType: StakeAuthorizationLayout.Withdrawer, // Type of authorization to change
      })
    );
  }

  // Set Fireblocks transaction note
  currentAuthorityConnection.setTxNote(
    `Changing stake account authorities for:\n${[...STAKE_ACCOUNTS]}\nfrom vault ${CURRENT_AUTHORITY_VAULT} to vault ${NEW_AUTHORITY_VAULT}`
  );
  
  // Send the transaction to be signed and sent by Fireblocks
  const fireblocksTxId = await sendAndConfirmTransaction(
    currentAuthorityConnection,
    transaction,
    []
  );
  console.log(
    "Transaction sent successfully, transaction ID:",
    fireblocksTxId
  );
};


// Execute the main function and handle any errors
main().catch((error) => {
  console.error("Error changing stake account authorization:", error);
});
