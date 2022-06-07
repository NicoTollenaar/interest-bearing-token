import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import InputGroup from "react-bootstrap/InputGroup";
import FormControl from "react-bootstrap/FormControl";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import contractAddressJSON from "./constants.json";
import EURDCJSON from "./artifacts/contracts/EURDC.sol/EURDC.json";
const contractAddress = contractAddressJSON.rinkeby;
const abi = EURDCJSON.abi;
function App() {
  const [addresses, setAddresses] = useState([]);
  const [signerAddress, setSignerAddress] = useState("");
  const [balances, setBalances] = useState([]);
  const [interestAmounts, setInterestAmounts] = useState([]);
  const [chainId, setChainId] = useState(0);

  useEffect(() => {
    connectMetaMask().catch((err) =>
      console.log("Error in calling connectUser, loggin error: ", err)
    );
  }, []);

  // useEffect(() => {
  //   if (typeof window.ethereum !== "undefined") {
  //     window.ethereum.on("accountsChanged", (accounts) => {
  //       setSignerAddress(accounts[0]);
  //       console.log(
  //         "In changedAccount OUTSIDE forbidden if block, logging accounts, accounts[0], addresses, and indexOf:",
  //         accounts,
  //         accounts[0],
  //         addresses,
  //         addresses.indexOf(accounts[0])
  //       );
  //       console.log(
  //         "Just before forbidden if in changeaccount block, logging addresses:",
  //         addresses
  //       );
  //       if (addresses.indexOf(accounts[0]) === -1) {
  //         console.log(
  //           "In changedAccount IN forbidden if block, logging accounts, accounts[0], addresses, and indexOf:",
  //           accounts,
  //           accounts[0],
  //           addresses,
  //           addresses.indexOf(accounts[0])
  //         );
  //         setAddresses((addresses) => addresses.concat(accounts[0]));
  //       }
  //     });
  //     window.ethereum.on("chainChanged", (chainId) => {
  //       setChainId(chainId);
  //     });
  //   } else {
  //     alert("Install MetaMask");
  //   }
  // }, [addresses]);

  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      getBalancesAndInterestAmounts().catch((err) =>
        console.log("Logging err in catch block after getbalances:", err)
      );
    } else {
      console.log("Install MetaMask");
    }
  }, [addresses]);

  async function connectMetaMask() {
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      if (addresses.indexOf(accounts[0]) === -1) {
        console.log(
          "In connectMetaMask in forbidden if block, logging accounts[0] and addresses, and indexOf:",
          accounts[0],
          addresses,
          addresses.indexOf(accounts[0])
        );
        setAddresses((addresses) => addresses.concat(accounts[0]));
      }
      setSignerAddress(accounts[0]);
      console.log("In connectMetaMask, logging accounts[0]:", accounts[0]);
      console.log("In connectMetaMask, loggingaddresses:", addresses);
    } catch (error) {
      console.log("Error in connectMetaMask, logging error: ", error);
    }
  }

  async function getBalancesAndInterestAmounts() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    console.log("In getBalances, logging provider:", provider);
    const signer = provider.getSigner();
    console.log("In getBalances, logging signer:", signer);
    const EURDC = new ethers.Contract(contractAddress, abi, provider);
    console.log("EURDC:", EURDC);
    let amount, interimInterest;
    console.log("Getbalances called, logging addresses:", addresses);
    addresses.forEach(async (address, index) => {
      amount = await EURDC.balanceOf(address);
      setBalances((balances) => {
        let copy = [...balances];
        copy[index] = ethers.utils.formatUnits(amount, 18);
        return copy;
      });
      console.log(`balances[]:`, ethers.utils.formatUnits(amount, 18));
      setInterval(async () => {
        interimInterest = await EURDC.callStatic.updateInterest(
          address,
          Math.floor(Date.now() / 1000)
        );
        console.log(
          "interimInterest[]:",
          ethers.utils.formatUnits(interimInterest, 27)
        );
        setInterestAmounts((interestAmounts) => {
          let copy = [...interestAmounts];
          copy[index] = ethers.utils.formatUnits(interimInterest, 27);
          return copy;
        });
      }, 1000);
    });
  }

  function handleClick(e) {
    const newAddress = document.getElementById("inputfield").value;
    console.log("In handleClick, logging newAddress:", newAddress);

    if (addresses.indexOf(newAddress) === -1) {
      setAddresses((addresses) => addresses.concat(newAddress));
    }
    console.log("In handlesubmit, logging addresses:", addresses);
  }

  console.log("Outside functions, logging addresses:", addresses);

  return (
    <>
      <Container>
        <Row>
          <Col>
            <h1>EURDC</h1>
          </Col>
        </Row>
        <Row>
          <InputGroup className="m-5">
            <Button
              variant="outline-secondary"
              id="button-addon1"
              type="button"
              onClick={handleClick}
            >
              Add address
            </Button>
            <FormControl
              aria-label="Example text with button addon"
              aria-describedby="basic-addon1"
              id="inputfield"
              // onChange={(e) =>
              //   setAddresses((addresses) => addresses.concat(e.target.value))
              // }
            />
          </InputGroup>
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
        {addresses.map((address, index) => (
          <Row key={index}>
            <Col>
              <h4 className="m-2">{address}</h4>
            </Col>
            <Col>
              <h4 className="m-2">{balances[index]}</h4>
            </Col>
            <Col>
              <h4 className="m-2">{interestAmounts[index]}</h4>
            </Col>
          </Row>
        ))}
      </Container>
    </>
  );
}

export default App;
