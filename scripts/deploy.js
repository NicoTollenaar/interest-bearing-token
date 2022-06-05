const fs = require("fs");
const hre = require("hardhat");
const annualInterestRate = 100;

async function main() {
  let balance;
  const accounts = await hre.ethers.provider.listAccounts();
  console.log("accounts:", accounts);
  const signerOne = hre.ethers.provider.getSigner(accounts[0]);
  balance = await signerOne.getBalance();
  console.log("ETH balance signerOne:", ethers.utils.formatUnits(balance, 18));
  const Factory = await hre.ethers.getContractFactory("EURDC");
  const EURDC = await Factory.deploy(0);
  await EURDC.deployed();

  console.log("EURDC address:", EURDC.address);
  const deployerAddress = EURDC.signer.address;
  console.log("Address deployer:", deployerAddress);

  const contractAddressJSON = fs.readFileSync("./scripts/contractAddress.json", "utf8");
  let contractAddress = {};
  if (contractAddressJSON) contractAddress = JSON.parse(contractAddressJSON);
  
  const { chainId } = await EURDC.provider.getNetwork();

  switch (chainId) {
    case 4:
      contractAddress.rinkeby = EURDC.address;
      break;
    case 31337:
      contractAddress.hardhat = EURDC.address;
      break;
    case 1337:
      contractAddress.ganache = EURDC.address;
      break;
    default:
      console.log("Something went wring in switch block");
  }

  console.log("logging contractAddress:", contractAddress);

  try {
    fs.writeFileSync('./scripts/contractAddress.json', JSON.stringify(contractAddress));
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
