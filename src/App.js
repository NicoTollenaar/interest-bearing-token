import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import contractAddressJSON from "./constants.json";
import EURDCJSON from "./artifacts/contracts/EURDC.sol/EURDC.json";
const contractAddress = contractAddressJSON.rinkeby;
const abi = EURDCJSON.abi;
function App() {
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState(0);
  const [interest, setInterest] = useState(0);
  const [chainId, setChainId] = useState(0);

  useEffect(() => {
    connectMetaMask().catch((err) =>
      console.log("Error in calling connectUser, loggin error: ", err)
    );
  }, []);

  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      window.ethereum.on("accountsChanged", (accounts) => {
        setAddress(accounts[0]);
      });
      window.ethereum.on("chainChanged", (chainId) => {
        setChainId(chainId);
      });
    } else {
      alert("Install MetaMask");
    }
  }, []);

  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      getBalanceAndInterest().catch((err) => console.log(err));
    } else {
      console.log("Install MetaMask");
    }
  }, [address]);

  async function connectMetaMask() {
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setAddress(accounts[0]);
      console.log("accounts[0]:", accounts[0]);
      console.log("address:", address);
    } catch (error) {
      console.log("Error in connectMetaMask, logging error: ", error);
    }
  }

  async function getBalanceAndInterest() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const EURDC = new ethers.Contract(contractAddress, abi, signer);
    console.log("signer.getAddress():", await signer.getAddress());
    console.log("address:", address);
    console.log("EURDC:", EURDC);
    let amount, interimInterest;
    amount = await EURDC.balanceOf(address);
    console.log("amount:", ethers.utils.formatUnits(amount, 18));
    setBalance(ethers.utils.formatUnits(amount, 18));
    setInterval(async () => {
      interimInterest = await EURDC.callStatic.updateInterest(
        address,
        Math.floor(Date.now() / 1000)
      );
      console.log(
        "interimInterest:",
        ethers.utils.formatUnits(interimInterest, 27)
      );
      setInterest(ethers.utils.formatUnits(interimInterest, 27));
    }, 1000);
  }

  return (
    <>
      <Container>
        <Row>
          <Col>
            <h1>EURDC</h1>
          </Col>
        </Row>
        <Row>
          <Col>
            <h2>Address</h2>
          </Col>
          <Col>
            <h2>Balance</h2>
          </Col>
          <Col>
            <h2>Interest</h2>
          </Col>
        </Row>
        <Row>
          <Col>
            <h4 className="m-2">{address}</h4>
          </Col>
          <Col>
            <h4 className="m-2">{balance}</h4>
          </Col>
          <Col>
            <h4 className="m-2">{interest}</h4>
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default App;
