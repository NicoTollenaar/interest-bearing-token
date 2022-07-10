const fs = require("fs");
const hre = require("hardhat");
const artifacts = require("../src/artifacts/contracts/EURDC.sol/EURDC.json");
const abi = artifacts.abi;
const bytecode = artifacts.bytecode;
const annualInterestRate = 0; //percentage per year, e.g. 0.1 for 10% compounding annually
const secondsPerYear = 60 * 60 * 24 * 365;
const effectiveRatePerSecond = (1 + annualInterestRate) ** (1 / secondsPerYear); //effective rate per second, compouding per second
const rateInRay = effectiveRatePerSecond * 10 ** 27;
const rateInRayFormatted = hre.ethers.BigNumber.from(
  rateInRay.toLocaleString("fullwide", { useGrouping: false })
);

async function main() {
  let balance;
  const accounts = await hre.ethers.provider.listAccounts();
  console.log("accounts:", accounts);
  const signerOne = hre.ethers.provider.getSigner(accounts[0]);
  balance = await signerOne.getBalance();
  console.log(
    "ETH balance signerOne:",
    hre.ethers.utils.formatUnits(balance, 18)
  );

  const Factory = new hre.ethers.ContractFactory(abi, bytecode, signerOne);
  const EURDC = await Factory.deploy(rateInRayFormatted);
  await EURDC.deployTransaction.wait();

  // const Factory = await new hre.ethers.getContractFactory("EURDC");
  // const EURDC = await Factory.deploy(rateInRayFormatted);
  // await EURDC.deployed();

  console.log("EURDC address:", EURDC.address);
  const deployerAddress = EURDC.signer._address;
  console.log("Address deployer:", deployerAddress);

  const contractAddressJSON = fs.readFileSync("./src/constants.json", "utf8");
  let contractAddress = {};
  if (contractAddressJSON) contractAddress = JSON.parse(contractAddressJSON);

  const { chainId } = await EURDC.provider.getNetwork();

  switch (chainId) {
    case 4:
      contractAddress.rinkeby = EURDC.address;
      contractAddress.rinkebyDeployer = deployerAddress;

      break;
    case 31337:
      contractAddress.hardhat = EURDC.address;
      contractAddress.hardhatDeployer = deployerAddress;
      break;
    case 1337:
      contractAddress.ganache = EURDC.address;
      contractAddress.ganacheDeployer = deployerAddress;
      break;
    default:
      console.log("Something went wring in switch block");
  }

  console.log("logging contractAddress:", contractAddress);

  try {
    fs.writeFileSync("./src/constants.json", JSON.stringify(contractAddress));
  } catch (err) {
    console.log(err);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
