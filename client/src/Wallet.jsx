import server from "./server";
import * as secp from "ethereum-cryptography/secp256k1";
import { hexToBytes, toHex } from "ethereum-cryptography/utils";

function Wallet({ address, setAddress, balance, setBalance, privateKey, setPrivateKey }) {
  async function onChange(evt) {
    const privateKey = evt.target.value;
    setPrivateKey(privateKey);
    const privateKeyBytes = hexToBytes(privateKey);
    const publicKeyBytes = secp.getPublicKey(privateKeyBytes);
    const address = toHex(publicKeyBytes);
    setAddress(address);
    if (address) {
      const {
        data: { balance },
      } = await server.get(`balance/${address}`);
      setBalance(balance);
    } else {
      setBalance(0);
    }
  }

  return (
    <div className="container wallet">
      <h1>Your Wallet</h1>

      <label>
        Private Key
        <input placeholder="Type private key" value={privateKey} onChange={onChange}></input>
      </label>

      {address && (
        <div className="address">
          <label>Public Key (Address):</label>
          <div>{address}</div>
        </div>
      )}

      <div className="balance">Balance: {balance}</div>
    </div>
  );
}

export default Wallet;
