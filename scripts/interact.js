const hre = require("hardhat");
const fs = require("fs");
const { ethers } = require("hardhat");
const principal = 1000;
const principalAsString = principal.toString();
const annualInterestRate = 0.1; //percentage per year, e.g. 0.1 for 10% compounding annually
const secondsPerYear = 60 * 60 * 24 * 365;
const effectiveRatePerSecond = (1 + annualInterestRate) ** (1 / secondsPerYear); 
//effective rate per second, compouding per second; see DS Math implementation. this is expressed as 1 + rate.
const rateInRay = effectiveRatePerSecond * 10 ** 27;
console.log("Math.floor(Date.now()/1000):", Math.floor(Date.now() / 1000));

console.log("effectiveRatePerSecond:", effectiveRatePerSecond);
console.log("rateInRay:", rateInRay, typeof rateInRay);

async function main() {
  let contractAddress, interest;
  let counter = 0;
  const contractAddressJSON = fs.readFileSync("./src/constants.json", "utf8");
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

  const EURDC = await hre.ethers.getContractAt(
    "EURDC",
    contractAddress,
    signerOne
  );
  console.log("Name:", await EURDC.name());
  console.log("Contract address:", EURDC.address);

  let tx = await EURDC.setInterestRate(
    ethers.BigNumber.from(
      rateInRay.toLocaleString("fullwide", { useGrouping: false })
    )
  );
  await tx.wait();

  // tx = await EURDC.issue(
  //   signerOne.address,
  //   ethers.utils.parseUnits(principalAsString, 18)
  // );
  // await tx.wait();

  let balanceSignerOne = await EURDC.balanceOf(signerOne.address);
  let balanceSignerTwo = await EURDC.balanceOf(signerTwo.address);
  console.log(
    "Balance signerOne before transfer:",
    ethers.utils.formatUnits(balanceSignerOne, 18)
  );
  console.log(
    "Balance signerTwo before transfer:",
    ethers.utils.formatUnits(balanceSignerTwo, 18)
  );

  let interestSignerOne = await EURDC.callStatic.updateInterest(
    signerOne.address,
    Math.floor(Date.now() / 1000)
  );
  let interestSignerTwo = await EURDC.callStatic.updateInterest(
    signerTwo.address,
    Math.floor(Date.now() / 1000)
  );
  console.log(
    "Logging interest signerOne before transfer:",
    ethers.utils.formatUnits(interestSignerOne, 27)
  );
  console.log(
    "Logging interest signerTwo before transfer:",
    ethers.utils.formatUnits(interestSignerTwo, 27)
  );

  // tx = await EURDC.addInterestToBalance(signerOne.address);
  // await tx.wait();
  // balanceSignerOne = await EURDC.balanceOf(signerOne.address);
  // console.log("Logging balance signerOne after adding interest to balance:", ethers.utils.formatUnits(balance, 27));

  // tx = await EURDC.transfer(signerTwo.address, balanceSignerOne);
  // await tx.wait();

  balanceSignerOne = await EURDC.balanceOf(signerOne.address);
  balanceSignerTwo = await EURDC.balanceOf(signerTwo.address);
  console.log(
    "Balance of signerOne after transfer:",
    ethers.utils.formatUnits(balanceSignerOne, 18)
  );
  console.log(
    "Balance of signerTwo after transfer:",
    ethers.utils.formatUnits(balanceSignerTwo, 18)
  );

  interestSignerOne = await EURDC.callStatic.updateInterest(
    signerOne.address,
    Math.floor(Date.now() / 1000)
  );
  interestSignerTwo = await EURDC.callStatic.updateInterest(
    signerTwo.address,
    Math.floor(Date.now() / 1000)
  );
  console.log(
    "Logging interest SignerOne after transfer:",
    ethers.utils.formatUnits(interestSignerOne, 27)
  );
  console.log(
    "Logging interest SignerTwo after transfer:",
    ethers.utils.formatUnits(interestSignerTwo, 27)
  );

  interestSignerTwo = await EURDC.callStatic.updateInterest(
    signerTwo.address,
    Math.floor(Date.now() / 1000)
  );
  console.log(
    "Logging interest SignerTwo:",
    ethers.utils.formatUnits(interestSignerTwo, 27)
  );

  const intervalOne = setInterval(async () => {
    interest = await EURDC.callStatic.updateInterest(
      signerTwo.address,
      Math.floor(Date.now() / 1000)
    );
    console.log(
      "Logging interest signerTwo in setInterval:",
      ethers.utils.formatUnits(interest, 27)
    );
    if (++counter > 10) clearInterval(intervalOne);
  }, 1000);

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
