const express = require("express");
const app = express();
const cors = require("cors");
const secp = require("ethereum-cryptography/secp256k1");
const { hexToBytes, toHex } = require("ethereum-cryptography/utils");
const { keccak256 } = require("ethereum-cryptography/keccak");
const port = process.env.PORT || 3042;

app.use(cors());
app.use(express.json());

const balances = {
  "0403ec16142a8c61d8e04d97d86914a5187107a29ab8cffa12f5923d22ab2c172aab825a185419581156c8b0795c25e338236a869c9914fadfcdfbdbda162edd6d": 100,
  "04cbb71a1ba5813af5e1040ed6b5a9e2cec40d1670194b26d0d910613581bd490090285a9c1ad211f036ab5a238fe41616432754b7d7e772cf60bca18e75a50778": 50,
  "049644ad2293697dd3706ae3500182c2f7493e0c3e2cd32ff34f2dbbe210b4ec09456c80820a8ddd44315754b037f754e85657443d73b89cfbb7bd2fc6ad09578d": 75,
};

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post("/send", (req, res) => {
  const { sender, recipient, amount, signature, recoveryBit } = req.body;

  // Validate required fields
  if (!signature || recoveryBit === undefined) {
    res.status(400).send({ message: "Missing signature or recovery bit!" });
    return;
  }

  // Recreate the message hash (must match what was signed on client)
  const message = {
    sender,
    amount: parseInt(amount),
    recipient,
  };
  const messageHash = keccak256(Buffer.from(JSON.stringify(message)));

  // Recover the public key from the signature
  const signatureBytes = hexToBytes(signature);
  const publicKey = secp.recoverPublicKey(messageHash, signatureBytes, recoveryBit);
  const recoveredAddress = toHex(publicKey);

  // Verify the recovered address matches the sender
  if (recoveredAddress !== sender) {
    res.status(400).send({ message: "Invalid signature! Recovered address does not match sender." });
    return;
  }

  setInitialBalance(sender);
  setInitialBalance(recipient);

  if (balances[sender] < amount) {
    res.status(400).send({ message: "Not enough funds!" });
  } else {
    balances[sender] -= amount;
    balances[recipient] += amount;
    res.send({ balance: balances[sender] });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}
