import { useState } from "react";
import server from "./server";
import * as secp from "ethereum-cryptography/secp256k1";
import { hexToBytes, toHex } from "ethereum-cryptography/utils";
import { keccak256 } from "ethereum-cryptography/keccak";

function Transfer({ address, setBalance, privateKey }) {
  const [sendAmount, setSendAmount] = useState("");
  const [recipient, setRecipient] = useState("");

  const setValue = (setter) => (evt) => setter(evt.target.value);

  async function transfer(evt) {
    evt.preventDefault();

    if (!privateKey) {
      alert("Please enter a private key first");
      return;
    }

    try {
      // Create a message hash from the transaction data
      const message = {
        sender: address,
        amount: parseInt(sendAmount),
        recipient,
      };
      const messageHash = keccak256(new TextEncoder().encode(JSON.stringify(message)));

      // Sign the message hash
      const [signature, recoveryBit] = await secp.sign(messageHash, hexToBytes(privateKey), {
        recovered: true,
      });

      // Send the transaction with the signature
      const {
        data: { balance },
      } = await server.post(`send`, {
        sender: address,
        amount: parseInt(sendAmount),
        recipient,
        signature: toHex(signature),
        recoveryBit,
      });
      setBalance(balance);
    } catch (ex) {
      alert(ex.response?.data?.message || ex.message);
    }
  }

  return (
    <form className="container transfer" onSubmit={transfer}>
      <h1>Send Transaction</h1>

      <label>
        Send Amount
        <input
          placeholder="1, 2, 3..."
          value={sendAmount}
          onChange={setValue(setSendAmount)}
        ></input>
      </label>

      <label>
        Recipient
        <input
          placeholder="Type an address, for example: 0x2"
          value={recipient}
          onChange={setValue(setRecipient)}
        ></input>
      </label>

      <input type="submit" className="button" value="Transfer" />
    </form>
  );
}

export default Transfer;
