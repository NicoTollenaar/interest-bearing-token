import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import FormControl from "react-bootstrap/FormControl";
import Table from "react-bootstrap/Table";
import { Trash } from "react-bootstrap-icons";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import contractAddressJSON from "./constants.json";
import EURDCJSON from "./artifacts/contracts/EURDC.sol/EURDC.json";
const network = "ganache";
const contractAddress = contractAddressJSON[`${network}`];
console.log("network:", network);
console.log("EURDC contractaddress:", contractAddress);
const abi = EURDCJSON.abi;
const provider = new ethers.providers.Web3Provider(window.ethereum);
const EURDC = new ethers.Contract(contractAddress, abi, provider);
let intervalId;

function App() {
  const [accounts, setAccounts] = useState([]);
  const [interestRate, setInterestRate] = useState(0);

  const [signerAddress, setSignerAddress] = useState("");
  const [network, setNetwork] = useState("");
  const [contractAddress, setContractAddress] = useState("");

  useEffect(() => {
    connectMetaMask().catch((err) =>
      console.log("Error in calling connectUser, loggin error: ", err)
    );
  }, []);

  useEffect(() => {
    getInterestRate()
      .then((result) => {
        setInterestRate(result);
      })
      .catch((err) => console.log(err));
  }, []);

  async function getInterestRate() {
    let rateInRay = await EURDC.getRateInRay();
    let annualRate = (rateInRay / 10 ** 27) ** (60 * 60 * 24 * 365) - 1;
    let annualRateRounded = annualRate.toFixed(2);
    return annualRateRounded;
  }

  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      window.ethereum.on("accountsChanged", (metamaskAccounts) => {
        setSignerAddress(metamaskAccounts[0]);
        if (getIndex(metamaskAccounts[0]) === -1) {
          setAccounts((accounts) => [
            ...accounts,
            { address: metamaskAccounts[0] },
          ]);
        }
      });
      window.ethereum.on("chainChanged", (chainId) => {
        const newNetworkName = getNetworkName(chainId);
        const newContractAddress = setNetwork(newNetworkName);
        setContractAddress();
      });
    } else {
      alert("Install MetaMask");
    }
  }, []);

  function getNetworkName(chainId) {
    let networkName;
    switch (chainId) {
      case "4":
        networkName = "rinkeby";
        break;
      case "31337":
        networkName = "hardhat";
        break;
      case "1337":
        networkName = "ganache";
        break;
      default:
        console.log("Something went wrong in switch block");
    }
    return networkName;
  }

  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(() => {
        setAccounts((accounts) => {
          let copyAccounts = JSON.parse(JSON.stringify(accounts));
          copyAccounts.forEach(async (account) => {
            let balance = await EURDC.balanceOf(account.address);
            let balanceFormatted = ethers.utils.formatUnits(balance, 18);
            let interest = await EURDC.callStatic.updateInterest(
              account.address,
              Math.floor(Date.now() / 1000)
            );
            let interestFormatted = ethers.utils.formatUnits(interest, 27);
            account.balance = balanceFormatted;
            account.interest = interestFormatted;
          });
          return copyAccounts;
        });
      }, 1000);
    } else {
      console.log("Install MetaMask!");
    }
    return () => {
      clearInterval(intervalId);
    };
  }, [accounts]);

  function getIndex(address) {
    for (let i = 0; i < accounts.length; i++) {
      if (accounts[i].address === address) return i;
    }
    return -1;
  }

  async function connectMetaMask() {
    try {
      const [connectedSignerAddress] = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      if (getIndex(connectedSignerAddress) === -1) {
        setAccounts((accounts) =>
          accounts.concat([{ address: connectedSignerAddress }])
        );
      }
    } catch (error) {
      console.log("Error in connectMetaMask, logging error: ", error);
    }
  }

  function handleAdd(e) {
    const newAddress = document.getElementById("inputfield").value;
    if (getIndex(newAddress) === -1) {
      setAccounts((accounts) => [...accounts, { address: newAddress }]);
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
    const signer = provider.getSigner();
    const toAddress = document.getElementById("transferTo").value;
    const amount = document.getElementById("transferAmount").value;
    const amountInWad = ethers.utils.parseUnits(amount.toString(), 18);
    let tx = await EURDC.connect(signer).transfer(toAddress, amountInWad, {
      gasLimit: 999999,
    });
    await tx.wait();
    if (getIndex(toAddress) === -1) {
      setAccounts((accounts) => accounts.concat([{ address: toAddress }]));
    }
  }

  async function handleIssue(e) {
    e.preventDefault();
    const deployerSigner = provider.getSigner();
    const toAddress = document.getElementById("issueTo").value;
    const amount = document.getElementById("issueAmount").value;
    const amountInWad = ethers.utils.parseUnits(amount.toString(), 18);
    try {
      let tx = await EURDC.connect(deployerSigner).issue(
        toAddress,
        amountInWad,
        { gasLimit: 999999 }
      );
      await tx.wait();
      if (getIndex(toAddress) === -1) {
        setAccounts((accounts) => accounts.concat([{ address: toAddress }]));
      }
    } catch (error) {
      console.log(
        "In catch block of issue function call, logging error:",
        error
      );
    }
  }

  function getRateInRayFormatted(annualRate) {
    const secondsPerYear = 60 * 60 * 24 * 365;
    const ratePerSecond = (1 + Number(annualRate)) ** (1 / secondsPerYear);
    const inRay = ratePerSecond * 10 ** 27;
    const inRayFormatted = ethers.BigNumber.from(
      inRay.toLocaleString("fullwide", { useGrouping: false })
    );
    return inRayFormatted;
  }

  async function handleChangeRate() {
    const newRate = document.getElementById("newRate").value;
    const newRateInRay = getRateInRayFormatted(newRate);
    const signer = provider.getSigner();
    const tx = await EURDC.connect(signer).setInterestRate(newRateInRay, {
      gasLimit: 999999,
    });
    await tx.wait();
    const newRateFromContract = await getInterestRate();
    setInterestRate(newRateFromContract);
  }

  function handleDelete(account) {
    let indexAccount = accounts.indexOf(account);
    setAccounts((accounts) => {
      let copyAccounts = [...accounts];
      copyAccounts.splice(indexAccount, 1);
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
          <Col className="d-flex">
            <h6 className="mt-4 me-3">Network:</h6>
            <Form.Select
              value={network}
              onChange={(e) => setChainId(e.target.value)}
              className="mt-3"
              aria-label="Default select example"
              size="sm"
            >
              <option value="1">Rinkeby</option>
              <option value="2">Ganache</option>
              <option value="3">Hardhat</option>
            </Form.Select>
          </Col>
          <Col className="d-flex justify-content-end align-items-center">
            <h6 className="mt-3">Annual Rate: {interestRate}</h6>
          </Col>
          <Col>
            <InputGroup className="mt-1 mb-1" placeholder="New interest rate">
              <Button
                className="sm mt-3"
                variant="outline-primary"
                id="button-addon1"
                type="button"
                onClick={handleChangeRate}
              >
                Change rate
              </Button>
              <FormControl
                className="mt-3"
                aria-label="Example text with button addon"
                aria-describedby="basic-addon1"
                id="newRate"
                type="number"
              />
            </InputGroup>
          </Col>
        </Row>
        <h6>Add addres</h6>
        <Row>
          <InputGroup className="mt-2 mb-2">
            <Button
              className="sm"
              variant="outline-primary"
              id="button-addon1"
              type="button"
              onClick={handleAdd}
            >
              Add address
            </Button>
            <FormControl
              placeholder="Address to add"
              aria-label="Example text with button addon"
              aria-describedby="basic-addon1"
              id="inputfield"
            />
          </InputGroup>
        </Row>
        <h6>Issue</h6>
        <Row>
          <Col>
            <Form onSubmit={handleIssue}>
              <Form.Group className="mb-3">
                <Form.Control
                  type="text"
                  placeholder="Issue to address"
                  id="issueTo"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <InputGroup className="mt-1 mb-1">
                  <Button
                    className="sm"
                    variant="outline-primary"
                    id="button-addon1"
                    type="submit"
                  >
                    Issue
                  </Button>
                  <Form.Control
                    type="number"
                    placeholder="Amount to issue"
                    id="issueAmount"
                  />
                </InputGroup>
              </Form.Group>
            </Form>
          </Col>
        </Row>
        <h6>Transfer</h6>
        <Row>
          <Col>
            <Form onSubmit={handleTransfer}>
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
                  placeholder="Transfer to address"
                  id="transferTo"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <InputGroup className="mt-1 mb-1">
                  <Button
                    className="sm"
                    variant="outline-primary"
                    id="button-addon1"
                    type="submit"
                  >
                    Transfer
                  </Button>
                  <Form.Control
                    type="number"
                    placeholder="Amount to transfer"
                    id="transferAmount"
                  />
                </InputGroup>
              </Form.Group>
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
            {accounts.map((account, index) => (
              <tr key={index}>
                <td>
                  <h6 className="m-2">{account.address}</h6>
                </td>
                <td>
                  <h6 className="m-2">{account.balance}</h6>
                </td>
                <td>
                  <h6 className="m-2">{account.interest}</h6>
                </td>
                <td>
                  <Button
                    className="sm"
                    type="button"
                    variant="outline-primary"
                    onClick={handleDelete}
                  >
                    <Trash />
                  </Button>
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
