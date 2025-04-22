import {
  PublicKey,
  StakeAuthorizationLayout,
  StakeProgram,
  Transaction,
  clusterApiUrl,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { FireblocksConnectionAdapter } from "solana-web3-adapter";

const API_KEY = "c0105e16-eca0-4480-8333-1a22f34c6cf8";
const API_SECRET_PATH = "/Users/slavaserebriannyi/api_keys/fireblocks_secret_new.key";
const CURRENT_AUTHORITY_VAULT = "2";
const NEW_AUTHORITY_VAULT = "133";
const STAKE_ACCOUNTS = [
  '9BpJAdXfRk4EoavH65BgcjNFdzDMekBJxJ1sm5xB82LC'
];

const main = async () => {
  const currentAuthorityConnection = await FireblocksConnectionAdapter.create(
    clusterApiUrl("mainnet-beta"),
    {
      apiKey: API_KEY,
      apiSecretPath: API_SECRET_PATH,
      vaultAccountId: CURRENT_AUTHORITY_VAULT,
    }
  );

  const newAuthorityConnection = await FireblocksConnectionAdapter.create(
    clusterApiUrl("mainnet-beta"),
    {
      apiKey: API_KEY,
      apiSecretPath: API_SECRET_PATH,
      vaultAccountId: NEW_AUTHORITY_VAULT,
    }
  );

  const transaction: Transaction = new Transaction();

  const currentAuthorizedPubkey = new PublicKey(
    currentAuthorityConnection.getAccount()
  );
  const newAuthorizedPubkey = new PublicKey(
    newAuthorityConnection.getAccount()
  );

  for (const stakeAccount of STAKE_ACCOUNTS) {
    transaction.add(
      StakeProgram.authorize({
        stakePubkey: new PublicKey(stakeAccount),
        authorizedPubkey: currentAuthorizedPubkey,
        newAuthorizedPubkey: newAuthorizedPubkey,
        stakeAuthorizationType: StakeAuthorizationLayout.Staker,
      })
    );

    transaction.add(
      StakeProgram.authorize({
        stakePubkey: new PublicKey(stakeAccount),
        authorizedPubkey: currentAuthorizedPubkey,
        newAuthorizedPubkey: newAuthorizedPubkey,
        stakeAuthorizationType: StakeAuthorizationLayout.Withdrawer,
      })
    );

    currentAuthorityConnection.setTxNote(
      `Changing stake account authorities for:\n${stakeAccount}\nfrom vault ${CURRENT_AUTHORITY_VAULT} to vault ${NEW_AUTHORITY_VAULT}`
    );

    const fireblocksTxId = await sendAndConfirmTransaction(
      currentAuthorityConnection,
      transaction,
      []
    );
    console.log(
      "Transaction sent successfully, transaction ID:",
      fireblocksTxId
    );
  }
};

main().catch((error) => {
  console.error("Error changing stake account authorization:", error);
});
