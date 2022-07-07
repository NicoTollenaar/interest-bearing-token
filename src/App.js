import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import FormControl from "react-bootstrap/FormControl";
import Table from "react-bootstrap/Table";
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
  //       if (addresses.indexOf(accounts[0]) === -1) {
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
    let intervalIds = [];
    if (typeof window.ethereum !== "undefined") {
      getBalancesAndInterestAmounts()
        .then((response) => {
          console.log("response:", response);
          intervalIds = response;
          console.log("IntervalIds in .then:", intervalIds);
        })
        .catch((err) =>
          console.log("Logging err in catch block after getbalances:", err)
        );
    } else {
      console.log("Install MetaMask");
    }
    console.log("IntervalIds at end of useEffect:", intervalIds);
    return () => {
      console.log("CLEANUP FUNCTION CALLED");
      intervalIds?.forEach((id) => clearInterval(id));
    };
  }, [addresses]);

  async function connectMetaMask() {
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      if (addresses.indexOf(accounts[0]) === -1) {
        setAddresses((addresses) => addresses.concat(accounts[0]));
      }
      setSignerAddress(accounts[0]);
      console.log("In connectMetaMask, loggingaddresses:", addresses);
    } catch (error) {
      console.log("Error in connectMetaMask, logging error: ", error);
    }
  }

  async function getBalancesAndInterestAmounts() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const EURDC = new ethers.Contract(contractAddress, abi, provider);
    let amount, interimInterest;
    console.log("In getbalances, logging addresses:", addresses);
    let intervalIds = [];
    addresses.forEach(async (address, index) => {
      amount = await EURDC.balanceOf(address);
      setBalances((balances) => {
        let copy = [...balances];
        if (copy[index]) {
          ethers.utils.formatUnits(amount, 18);
        } else copy.push(ethers.utils.formatUnits(amount, 18));
        return copy;
      });
      intervalIds[index] = setInterval(async () => {
        interimInterest = await EURDC.callStatic.updateInterest(
          address,
          Math.floor(Date.now() / 1000)
        );
        setInterestAmounts((interestAmounts) => {
          let copy = [...interestAmounts];
          copy[index] = ethers.utils.formatUnits(interimInterest, 27);
          return copy;
        });
      }, 1000);
    });
    console.log("intervalIds:", intervalIds);
    return intervalIds;
  }

  function handleClick(e) {
    const newAddress = document.getElementById("inputfield").value;
    if (addresses.indexOf(newAddress) === -1) {
      setAddresses((addresses) => addresses.concat(newAddress));
    }
    console.log("In handlesubmit, logging addresses:", addresses);
  }

  async function handleTransfer(e) {
    e.preventDefault();
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    let signer = provider.getSigner();
    const signerAddress = signer.getAddress();
    const fromAddress = document.getElementById("transferFrom").value;
    let newSigner;
    while (signerAddress !== fromAddress) {
      alert("connect correct account");
      [newSigner] = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      signer = newSigner;
    }
    const toAddress = document.getElementById("transferTo").value;
    const amount = document.getElementById("transferAmount").value;
    const amountInWad = ethers.utils.parseUnits(amount.toString(), 18);
    const EURDC = new ethers.Contract(contractAddress, abi, signer);
    let tx = await EURDC.connect(signer).transfer(toAddress, amountInWad);
    await tx.wait();
    const newBalanceSender = await EURDC.balanceOf(fromAddress);
    const newBalanceRecipient = await EURDC.balanceOf(toAddress);
    const indexFromAddress = addresses.indexOf(fromAddress);
    const indexToAddress = addresses.indexOf(toAddress);
    setBalances((balances) => {
      const copy = [...balances];
      copy[indexFromAddress] = ethers.utils.formatUnits(newBalanceSender, 18);
      copy[indexToAddress] = ethers.utils.formatUnits(newBalanceRecipient, 18);
      return copy;
    });
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
            <Form>
              <Form.Group className="mb-3">
                <Form.Control
                  type="text"
                  placeholder="From address"
                  id="transferFrom"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Control
                  type="text"
                  placeholder="To address"
                  id="transferTo"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Control
                  type="number"
                  placeholder="Amount"
                  id="transferAmount"
                />
              </Form.Group>
              <Button variant="primary" type="submit" onSubmit={handleTransfer}>
                Transfer
              </Button>
            </Form>
          </Col>
        </Row>

        <Table striped bordered hover size="sm">
          <thead>
            <tr>
              <th>Address</th>
              <th>Balance</th>
              <th>Interest</th>
            </tr>
          </thead>
          <tbody>
            {addresses.map((address, index) => (
              <tr key={index}>
                <td>
                  <h4 className="m-2">{address}</h4>
                </td>
                <td>
                  <h4 className="m-2">{balances[index]}</h4>
                </td>
                <td>
                  <h4 className="m-2">{interestAmounts[index]}</h4>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Container>
    </>
  );
}

export default App;
