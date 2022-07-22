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
import networks from "./networkFile.js";

const abi = EURDCJSON.abi;
const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
let intervalId;

function App() {
  const [accounts, setAccounts] = useState([]);
  const [interestRate, setInterestRate] = useState(0);
  const [signerAddress, setSignerAddress] = useState("");
  const [chainId, setChainId] = useState("");
  const [contractAddress, setContractAddress] = useState("");
  const [EURDC, setEURDC] = useState({});

  // useEffect(() => {
  //   connectMetaMask().catch((err) =>
  //     console.log("Error in calling connectUser, loggin error: ", err)
  //   );
  // }, []);

  async function connectMetaMask() {
    try {
      const [connectedSignerAddress] = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      // if (getIndex(connectedSignerAddress) === -1) {
      //   setAccounts((accounts) => [
      //     ...accounts,
      //     { address: connectedSignerAddress },
      //   ]);
      // }
    } catch (error) {
      console.log("Error in connectMetaMask, logging error: ", error);
    }
  }

  useEffect(() => {
    provider
      .getNetwork()
      .then((network) => {
        console.log(
          "In useEffect getNetwork, logging ethers.utilshexValue(network.chainId):",
          ethers.utils.hexValue(network.chainId)
        );
        setChainId(ethers.utils.hexValue(network.chainId));
      })
      .catch((err) => console.log(err));
  }, []);

  useEffect(() => {
    console.log(
      "In useeffect calling getNetworkName, logging chainId:",
      chainId
    );
    const networkName = getNetworkName();
    console.log("In useEffect, logging networkName:", networkName);
    console.log(
      "contractAddressJSON[{networkName}]:",
      contractAddressJSON[`${networkName}`]
    );
    setContractAddress(contractAddressJSON[`${networkName}`]);
  }, [chainId]);

  useEffect(() => {
    console.log(
      "In useEffect creating contract instance, logging contractaddress:",
      contractAddress
    );
    if (contractAddress) {
      const newContract = new ethers.Contract(contractAddress, abi, provider);
      console.log(
        "In useEffect creating contract instance, logging EURDC (newContract):",
        newContract
      );
      setEURDC(newContract);
    }
  }, [contractAddress]);

  useEffect(() => {
    if (EURDC.address) {
      getInterestRate()
        .then((result) => {
          setInterestRate(result);
        })
        .catch((err) => console.log(err));
    }
  }, [EURDC]);

  async function getInterestRate() {
    let rateInRay = await EURDC.getRateInRay();
    let annualRate = (rateInRay / 10 ** 27) ** (60 * 60 * 24 * 365) - 1;
    let annualRateRounded = annualRate.toFixed(2);
    return annualRateRounded;
  }

  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      window.ethereum.on("accountsChanged", handleAccountsChange);
    } else {
      alert("Install MetaMask");
    }
    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChange);
    };
  }, [accounts]);

  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      window.ethereum.on("chainChanged", handleChainChange);
    } else {
      alert("Install MetaMask");
    }
    return () => {
      window.ethereum.removeListener("chainChanged", handleChainChange);
    };
  }, [accounts]);

  function handleChainChange(chainId) {
    console.log(
      "In listener (indirectly,  via handleChange), chain changed, new chainid:",
      chainId
    );
    setChainId(chainId);
  }

  function handleAccountsChange(accountsArray) {
    console.log("In listener logging metamaskaccounts[0]:", accountsArray[0]);
    console.log("in same place logging accounts:", accounts);
    setSignerAddress(accountsArray[0]);
    if (getIndex(accountsArray[0]) === -1) {
      console.log(
        "in listener on accountsChanged, logging getIndex(accountsArray[0]):",
        getIndex(accountsArray[0])
      );
      setAccounts((accounts) => [...accounts, { address: accountsArray[0] }]);
    }
  }

  function getNetworkName() {
    let networkName;
    switch (chainId) {
      case "0x4":
        networkName = "rinkeby";
        break;
      case "0x5":
        networkName = "goerli";
        break;
      case "0x7a69":
        networkName = "hardhat";
        break;
      case "0x539":
        networkName = "ganache";
        break;
      default:
        console.log("In switch block, no chainId yet");
    }
    return networkName;
  }

  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      if (intervalId) clearInterval(intervalId);
      if (EURDC.address) {
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
      }
    } else {
      console.log("Install MetaMask!");
    }
    return () => {
      clearInterval(intervalId);
    };
  }, [accounts, EURDC]);

  // console.log(
  //   "Outside of all functions logging acconts.length and accounts:",
  //   accounts.length,
  //   accounts
  // );

  function getIndex(address) {
    console.log(
      "In getIndex logging accounts.length and accounts:",
      accounts.length,
      accounts
    );
    if (accounts.length === 0) return -1;
    for (let i = 0; i < accounts.length; i++) {
      console.log(
        "accounts[i].address.toLowerCase()",
        accounts[i].address.toLowerCase()
      );
      console.log("address.toLowerCase():", address.toLowerCase());
      if (accounts[i].address.toLowerCase() === address.toLowerCase()) {
        return i;
      }
    }
    return -1;
  }

  function handleAdd(e) {
    const newAddress = document.getElementById("inputfield").value;
    if (getIndex(newAddress) === -1) {
      console.log(
        "in handle Add past getIndex condition:",
        getIndex(newAddress)
      );
      setAccounts((accounts) => [...accounts, { address: newAddress }]);
    }
  }

  async function handleTransfer(e) {
    e.preventDefault();
    const fromAddress = document.getElementById("transferFrom").value;
    if (signerAddress.toLowerCase() !== fromAddress.toLowerCase()) {
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
        console.log("condition getIndex -1 met:");
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

  async function handleSwitchNetwork(e) {
    console.log(
      "In handleSwitchNetwork, logging e.target.value:",
      e.target.value
    );
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: e.target.value }],
      });
    } catch (switchError) {
      console.log(
        "In switch network catch block, logging addError:",
        switchError
      );
      if (switchError.code === 4902) {
        const networkToAdd = networks.reduce((curr, acc) => {
          if (curr.chainId === e.target.value) acc = curr;
          return acc;
        });
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [networkToAdd],
          });
        } catch (addError) {
          console.log(
            "In add network catch block, logging addError:",
            addError
          );
        }
      }
    }
  }

  provider
    .getNetwork()
    .then((network) => {
      console.log("true network name and Id:", network.name, network.chainId);
    })
    .catch((err) => console.log(err));

  useEffect(() => {
    async function getAccounts() {
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      setSignerAddress(address);
      const listedAccounts = await provider.listAccounts();
      console.log(
        "In useEffect getAccounts, logging listedAccounts:",
        listedAccounts
      );
      return listedAccounts;
    }
    getAccounts()
      .then((listedAccounts) => {
        const networkAccounts = listedAccounts.map((e) => {
          return { address: e };
        });
        console.log(
          "In useEffect getAccounts, logging networkAccounts:",
          networkAccounts
        );
        setAccounts(networkAccounts);
      })
      .catch((err) => console.log(err));
  }, [chainId]);

  return (
    <>
      <Container>
        <Row className="d-flex justify-content-between">
          <Col md="auto">
            <h1>EURDC</h1>
          </Col>

          <Col
            md="auto"
            className="d-flex d-row inline justify-content-between mt-4"
          >
            <h6>Contract address:</h6>
            <p>{contractAddress}</p>
          </Col>
          <Col md="auto">
            <Button
              className="mt-3"
              onClick={connectMetaMask}
              variant="secondary"
              size="sm"
            >
              Connect MetaMask
            </Button>
          </Col>
        </Row>
        <Row className="d-flex justify-content-between">
          <Col md="auto" className="d-flex">
            <h6 className="mt-4 me-3">Network:</h6>
            <Form.Select
              value={chainId}
              // defaultValue={chainId}
              onChange={handleSwitchNetwork}
              className="mt-3 selected"
              aria-label="Default select example"
              size="sm"
            >
              {networks.map((network, index) => (
                <option
                  key={index}
                  value={network.chainId}
                  className={
                    network.chainId === chainId ? "selected" : "unselected"
                  }
                >
                  {network.chainName}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col
            md="auto"
            className="d-flex justify-content-end align-items-center"
          >
            <h6 className="mt-3">Annual Rate: {interestRate}</h6>
          </Col>
          <Col md="auto">
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
                size="sm"
                className="mt-3 change-rate-form"
                aria-label="Example text with button addon"
                aria-describedby="basic-addon1"
                id="newRate"
                type="number"
              />
            </InputGroup>
          </Col>
        </Row>
        <h6 className="mt-3">Add addres</h6>
        {/* <p>{signerAddress}</p> */}
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
                  <h6
                    className={
                      account.address.toLowerCase() ===
                      signerAddress.toLowerCase()
                        ? "m-2 signer"
                        : "m-2"
                    }
                  >
                    {account.address}
                  </h6>
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
