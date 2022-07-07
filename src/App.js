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
const provider = new ethers.providers.Web3Provider(window.ethereum);
const EURDC = new ethers.Contract(contractAddress, abi, provider);

function App() {
  const [accounts, setAccounts] = useState([
    {
      address: "",
      balance: 0,
      interest: 0,
    },
  ]);
  const [signerAddress, setSignerAddress] = useState("");
  const [chainId, setChainId] = useState(0);
  // const [balances, setBalances] = useState([]);
  // const [interestAmounts, setInterestAmounts] = useState([]);

  useEffect(() => {
    connectMetaMask().catch((err) =>
      console.log("Error in calling connectUser, loggin error: ", err)
    );
  }, []);

  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      window.ethereum.on("accountsChanged", (accounts) => {
        setSignerAddress(accounts[0]);
        if (!getIndex(accounts[0])) {
          setAccounts((accounts) => accounts.concat({ address: accounts[0] }));
        }
      });
      window.ethereum.on("chainChanged", (chainId) => {
        setChainId(chainId);
      });
    } else {
      alert("Install MetaMask");
    }
  }, []);

  useEffect(() => {
    let intervalId;
    if (typeof window.ethereum !== "undefined") {
      getBalancesAndInterestAmounts()
        .then((response) => {
          intervalId = response;
        })
        .catch((err) =>
          console.log("Logging err in catch block after getbalances:", err)
        );
    } else {
      console.log("Install MetaMask!");
    }
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  function getIndex(address) {
    for (let i = 0; i < accounts.length; i++) {
      if ((accounts[i].address = address)) return i;
    }
    return -1;
  }

  async function connectMetaMask() {
    try {
      const [connectedSigner] = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      if (getIndex === -1) {
        setAccounts((accounts) =>
          accounts.concat({ address: connectedSigner })
        );
      }
    } catch (error) {
      console.log("Error in connectMetaMask, logging error: ", error);
    }
  }

  async function getBalancesAndInterestAmounts() {
    let balance, balanceFormatted, interest, interestFormatted;
    const intervalId = setInterval(() => {
      accounts.forEach(async (account, index) => {
        balance = await EURDC.balanceOf(account.address);
        balanceFormatted = ethers.utils.formatUnits(balance, 18);
        interest = await EURDC.callStatic.updateInterest(
          account.address,
          Math.floor(Date.now() / 1000)
        );
        interestFormatted = ethers.utils.formatUnits(interest, 27);
        setAccounts((accounts) => {
          const copyAccounts = [...accounts];
          copyAccounts[index] = {
            ...accounts[index],
            balance: balanceFormatted,
            interest: interestFormatted,
          };
          return copyAccounts;
        });
        return intervalId;
      });
    });
  }

  function handleClick(e) {
    const newAddress = document.getElementById("inputfield").value;
    if (accounts.indexOf(newAddress) === -1) {
      setAccounts((accounts) => accounts.concat(newAddress));
    }
  }

  async function handleTransfer(e) {
    e.preventDefault();
    const fromAddress = document.getElementById("transferFrom").value;
    if (signerAddress !== fromAddress) {
      alert("connect correct account");
      const [newSigner] = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setSignerAddress(newSigner);
    }
    const signer = await provider.getSigner();
    const toAddress = document.getElementById("transferTo").value;
    const amount = document.getElementById("transferAmount").value;
    const amountInWad = ethers.utils.parseUnits(amount.toString(), 18);
    let tx = await EURDC.connect(signer).transfer(toAddress, amountInWad);
    await tx.wait();
    const newBalanceSender = await EURDC.balanceOf(fromAddress);
    const newBalanceRecipient = await EURDC.balanceOf(toAddress);
    const indexFromAddress = getIndex(fromAddress);
    const indexToAddress = getIndex(toAddress);
    setAccounts((accounts) => {
      const copyAccounts = [...accounts];
      copyAccounts[indexFromAddress] = {
        ...accounts[indexFromAddress],
        balance: ethers.utils.formatUnits(newBalanceSender, 18),
      };
      copyAccounts[indexToAddress] = {
        ...accounts[indexToAddress],
        balance: ethers.utils.formatUnits(newBalanceRecipient, 18),
      };
      return copyAccounts;
    });
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
              //   setAccounts((accounts) => accounts.concat(e.target.value))
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
            {accounts.map((address, index) => (
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
