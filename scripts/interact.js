
const hre = require("hardhat");
const fs = require("fs");
const { ethers } = require("hardhat");
const annualInterestRate = 0.1; //percentage per year, e.g. 0.1 for 10%
const secondsPerYear = 60*60*24*365.25;
const effectiveRatePerSecond = (1+annualInterestRate)**(1/secondsPerYear);
const rateInRay = 10**27 + effectiveRatePerSecond*10**27

console.log("effectiveRatePerSecond:", effectiveRatePerSecond);
console.log("rateInRay:", rateInRay);

async function main() {
  let balance, contractAddress, interest;
  let counter = 0;
  const contractAddressJSON = fs.readFileSync("./scripts/contractAddress.json", "utf8");
  const contractAddressObject = JSON.parse(contractAddressJSON);
  console.log("Logging contractAddressObject:", contractAddressObject);

  const [signerOne, signerTwo] = await hre.ethers.getSigners();
  console.log("signerOne address:", signerOne.address);
  console.log("signerTwo address:", signerTwo.address);

  const chainId = await signerOne.getChainId();
  console.log("Logging chainId:", chainId);

  switch (chainId) {
    case 4:
      contractAddress = contractAddressObject.rinkeby;
      break;
    case 31337:
      contractAddress = contractAddressObject.hardhat;
      break;
    case 1337:
      contractAddress = contractAddressObject.ganache;
      break;
    default:
      console.log("Something went wrong in switch block");
  }

  const EURDC = await hre.ethers.getContractAt("EURDC", contractAddress, signerOne);
  console.log("Name:", await EURDC.name());
  console.log("Contract address:", EURDC.address);

  let tx = await EURDC.issue(signerOne.address, (ethers.BigNumber.from((10**18).toString())));
  await tx.wait();

  balanceSignerOne = await EURDC.balanceOf(signerOne.address);
  // balanceSignerTwo = await EURDC.balanceOf(signerTwo.address);
  console.log("Balance of signerOne:", ethers.utils.formatUnits(balanceSignerOne, 18));
  // console.log("Balance of signerTwo:", balanceSignerTwo);

  // tx = await EURDC.calculateInterest(signerOne.address);
  // await tx.wait();

  interest = await EURDC.callStatic.calculateInterest(signerOne.address);
  console.log("Logging interest:", ethers.utils.formatUnits(interest, 18));

  // tx = await EURDC.addInterestToBalance(signerOne.address);
  // await tx.wait();
  // balance = await EURDC.balanceOf(signerOne.address)
  // console.log("Logging balance signerOne after adding interest to balance:", ethers.utils.formatUnits(balance, 18));

  const intervalOne = setInterval(async() => {
    interest = await EURDC.callStatic.calculateInterest(signerOne.address);
    console.log("Logging interest in setInterval:", ethers.utils.formatUnits(interest, 18));
    if (++counter > 10) clearInterval(intervalOne);
  }, 10000);

  // tx = await EURDC.transfer(signerTwo.address, balanceSignerOne)
  // await tx.wait();

  // balanceSignerOne = await EURDC.balanceOf(signerOne.address);
  // balanceSignerTwo = await EURDC.balanceOf(signerTwo.address);
  // console.log("Balance of signerOne:", balanceSignerOne);
  // console.log("Balance of signerTwo:", balanceSignerTwo);

}

main();
// main()
//   .then(() => process.exit(0))
//   .catch((error) => {
//     console.error(error);
//     process.exit(1);
//   });
