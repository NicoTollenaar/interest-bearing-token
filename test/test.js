const { assert, expect } = require("chai");
const { ethers } = require("hardhat");
const fs = require("fs");
const annualInterestRate = 0.1; //percentage per year, e.g. 0.1 for 10% compounding annually
const secondsPerYear = 60 * 60 * 24 * 365;
const effectiveRatePerSecond = (1 + annualInterestRate) ** (1 / secondsPerYear); //effective rate per second, compouding per second
const rateInRay = effectiveRatePerSecond * 10 ** 27;
const rateInRayFormatted = ethers.BigNumber.from(
  rateInRay.toLocaleString("fullwide", { useGrouping: false })
);

function getRateInRayFormatted(annualRate) {
  const ratePerSecond = (1 + annualRate) ** (1 / secondsPerYear);
  const inRay = ratePerSecond * 10 ** 27;
  console.log(
    "inRay.toLocaleString(...):",
    inRay.toLocaleString("fullwide", { useGrouping: false })
  );
  const inRayFormatted = ethers.BigNumber.from(
    inRay.toLocaleString("fullwide", { useGrouping: false })
  );
  console.log("new interest formatted in ray:", Number(inRayFormatted));
  return inRayFormatted;
}

function calculatedAccruedInterest(principal, ratePerSecond, timeExpired) {
  return principal * ratePerSecond ** timeExpired - principal;
}

describe("Testing EURDC contract", function () {
  this.timeout(0);
  let tx, deployerAddress, EURDC, interest, issueTimestamp;
  before(async function () {
    try {
      const Factory = await ethers.getContractFactory("EURDC");
      EURDC = await Factory.deploy(rateInRayFormatted);
      await EURDC.deployed();
      deployerAddress = EURDC.signer.address;
      tx = await EURDC.setInterestRate(rateInRayFormatted);
      // tx = await EURDC.setInterestRate(
      //   ethers.BigNumber.from(
      //     rateInRay.toLocaleString("fullwide", { useGrouping: false })
      //   )
      // );
      await tx.wait();
    } catch (error) {
      console.log("Error in catch block:", error);
    }
  });
  describe("EURDC.issue", async function () {
    it("should issue 1000 to deployer", async function () {
      tx = await EURDC.issue(
        deployerAddress,
        ethers.utils.parseUnits("1000", 18)
      );
      await tx.wait();
      let block = await ethers.provider.getBlock(tx.blockNumber);
      issueTimestamp = block.timestamp;
      let balanceDeployer = await EURDC.balanceOf(deployerAddress);
      console.log(
        "Balance deployer:",
        ethers.utils.formatUnits(balanceDeployer, 18)
      );
      assert.equal(ethers.utils.formatUnits(balanceDeployer, 18), 1000);
    });

    // it("should add deployer to tokenholders array", async function () {
    //   const tokenholdersArray = await EURDC.tokenholders(0);
    //   console.log("tokenholdersArray:", tokenholdersArray);
    //   assert.equal(
    //     tokenholdersArray,
    //     [deployerAddress],
    //     "tokenholdersArray should equal [deployerAddress]"
    //   );
    // });
  });

  describe("Tests for EURDC.updateInterest function", async function () {
    let interestNewSolidity;

    it("should compound interest per second", async function () {
      const currentTimestamp = issueTimestamp + 60 * 60 * 24 * 365 * 30;
      // const currentTimestamp = Math.floor(Date.now() / 1000);
      const timeLapsed = currentTimestamp - issueTimestamp;
      const interestJavascript = calculatedAccruedInterest(
        1000,
        effectiveRatePerSecond,
        timeLapsed
      );
      console.log("interestJavascript:", interestJavascript);
      interestNewSolidity = await EURDC.callStatic.updateInterest(
        deployerAddress,
        currentTimestamp
      );
      console.log(
        "Logging interest deployer from solidity:",
        ethers.utils.formatUnits(interestNewSolidity, 27)
      );
      expect(
        Number(ethers.utils.formatUnits(interestNewSolidity, 27))
      ).to.be.closeTo(
        Number(interestJavascript.toFixed(9)),
        Number(interestJavascript.toFixed(9) * 0.000001)
      );
    });

    it("should give the same interest as 10% compounding annually", async function () {
      const numberOfYears = 30;
      const currentTimestamp =
        issueTimestamp + 60 * 60 * 24 * 365 * numberOfYears;
      const timeLapsed = currentTimestamp - issueTimestamp;
      console.log("First issue timestamp:", issueTimestamp);
      const interestCompoundingAnnually = 1000 * 1.1 ** numberOfYears - 1000;
      console.log(
        "interest compounding annually in javasript:",
        interestCompoundingAnnually
      );
      const interestCompoundingPerSecond =
        await EURDC.callStatic.updateInterest(
          deployerAddress,
          currentTimestamp
        );
      console.log(
        "Interest compounding per second in solidity:",
        ethers.utils.formatUnits(interestCompoundingPerSecond, 27)
      );
      expect(
        Number(ethers.utils.formatUnits(interestCompoundingPerSecond, 27))
      ).to.be.closeTo(
        Number(interestCompoundingAnnually.toFixed(27)),
        Number(interestCompoundingAnnually.toFixed(27) * 0.0000001)
      );
    });
    it("the rate compounding per second should translate to an annual interest rate compounding annually that is lower than the annual rate", function () {
      let translatedRateOnAnnualBasis =
        (effectiveRatePerSecond - 1) * 60 * 60 * 24 * 365;
      console.log(
        "effective rate per second translates to rate per year compounding annually:",
        translatedRateOnAnnualBasis
      );
      assert(translatedRateOnAnnualBasis < annualInterestRate);
    });
  });

  describe("Tests for second issue to deployer", async function () {
    let secondIssueTimestamp, oldBalance, block;
    before((done) => setTimeout(done, 5000));

    before(async function () {
      const latestBlock = await ethers.provider.getBlock("latest");
      const latestBlockTimestamp = latestBlock.timestamp;
      console.log("latestBlockTimestamp:", latestBlockTimestamp);
      oldBalance = await EURDC.balanceOf(deployerAddress);
      console.log("oldBalance:", ethers.utils.formatUnits(oldBalance, 18));
      const ETHbalance = await ethers.provider.getBalance(deployerAddress);
      console.log(
        "ETHBalance deployer:",
        ethers.utils.formatUnits(ETHbalance, 18)
      );
      tx = await EURDC.issue(
        deployerAddress,
        ethers.utils.parseUnits("9000", 18)
      );
      await tx.wait();
      block = await ethers.provider.getBlock(tx.blockNumber);
      secondIssueTimestamp = block.timestamp;
      console.log("secondIssueTimestamp:", secondIssueTimestamp);
    });

    it("should add interest to balance", async function () {
      let newBalance = await EURDC.balanceOf(deployerAddress);
      console.log("newBalance:", ethers.utils.formatUnits(newBalance, 18));
      assert(ethers.utils.formatUnits(newBalance, 18) > 10000);
    });

    it("should set the depositor's interest to zero", async function () {
      interest = await EURDC.getInterest(deployerAddress);
      console.log("interest:", interest);
      assert.equal(interest, 0);
    });

    it("should start accruing interest again", async function () {
      block = await ethers.provider.getBlock(tx.blockNumber);
      let oneOrMoreSecondsLater = block.timestamp + 1;
      interest = await EURDC.callStatic.updateInterest(
        deployerAddress,
        oneOrMoreSecondsLater
      );
      console.log(
        "interest one or more seconds later:",
        ethers.utils.formatUnits(interest, 27)
      );
      assert(interest > 0);
    });
  });

  describe("Tests transfer function", async function () {
    let transferTimestamp,
      oldBalanceDeployer,
      initialBalanceRecipient,
      block,
      interestBeforeTransfer,
      lastTimestampDeployer;
    let recipientAddress;
    const transferAmount = "4000";

    before(async function () {
      [, recipientAddress] = await ethers.provider.listAccounts();
      console.log("recipientAddress:", recipientAddress);
      const latestBlock = await ethers.provider.getBlock("latest");
      const latestBlockTimestamp = latestBlock.timestamp;
      console.log("latestBlockTimestamp:", latestBlockTimestamp);
      oldBalanceDeployer = await EURDC.balanceOf(deployerAddress);
      initialBalanceRecipient = await EURDC.balanceOf(recipientAddress);
      console.log(
        "oldBalance deployer:",
        ethers.utils.formatUnits(oldBalanceDeployer, 18)
      );
      console.log(
        "initialBalanceRecipient:",
        ethers.utils.formatUnits(initialBalanceRecipient, 18)
      );
      // console.log("Date.now:", Math.ceil(Date.now() / 1000) + 1);
      // interestBeforeTransfer = await EURDC.callStatic.updateInterest(
      //   deployerAddress,
      //   Math.ceil(Date.now() / 1000) + 1
      // );
      // console.log(
      //   "interestBeforeTransfer:",
      //   ethers.utils.formatUnits(interestBeforeTransfer, 27)
      // );
      lastTimestampDeployer = await EURDC.getLastTimestamp(deployerAddress);
      console.log("lastTimestampDeployer:", lastTimestampDeployer.toNumber());
      tx = await EURDC.transfer(
        recipientAddress,
        ethers.utils.parseUnits(transferAmount, 18)
        // { gasLimit: 10000, gasPrice: 50000 }
      );
      await tx.wait();
      block = await ethers.provider.getBlock(tx.blockNumber);
      transferTimestamp = block.timestamp;
      console.log("transferTimestamp:", transferTimestamp);
    });

    it("should add accrued interest to deployer's balance before transfer", async function () {
      let newBalanceDeployer = await EURDC.balanceOf(deployerAddress);
      console.log(
        "newBalanceDeployer:",
        ethers.utils.formatUnits(newBalanceDeployer, 18)
      );
      const oldBalanceDeployerFormatted = ethers.utils.formatUnits(
        oldBalanceDeployer,
        18
      );
      console.log("oldBalanceDeployerFormatted:", oldBalanceDeployerFormatted);
      console.log("Number(transferAmount):", Number(transferAmount));
      let timeExpired = transferTimestamp - lastTimestampDeployer.toNumber();
      interestBeforeTransfer = calculatedAccruedInterest(
        oldBalanceDeployerFormatted,
        effectiveRatePerSecond,
        timeExpired
      );
      console.log("interestBeforeTransfer:", Number(interestBeforeTransfer));
      assert.equal(
        Number(ethers.utils.formatUnits(newBalanceDeployer, 18)) +
          Number(transferAmount),
        Number(oldBalanceDeployerFormatted) + Number(interestBeforeTransfer, 27)
      );
    });

    it("should set the depositor's interest to zero after transfer", async function () {
      interest = await EURDC.getInterest(deployerAddress);
      console.log("interest deployer after transfer:", interest.toNumber());
      assert.equal(interest, 0);
    });

    it("deployer's balance should start accruing interest again", async function () {
      block = await ethers.provider.getBlock(tx.blockNumber);
      let oneOrMoreSecondsLater = block.timestamp + 1;
      interest = await EURDC.callStatic.updateInterest(
        deployerAddress,
        oneOrMoreSecondsLater
      );
      console.log(
        "interest one or more seconds later on deployer's balance:",
        ethers.utils.formatUnits(interest, 27)
      );
      assert(interest > 0);
    });

    it("should transfer transfer amount to recipient", async function () {
      const newBalanceRecipient = await EURDC.balanceOf(recipientAddress);
      assert.equal(
        ethers.utils.formatUnits(newBalanceRecipient, 18),
        Number(transferAmount)
      );
    });

    it("recipient's balance should start accruing interest", async function () {
      block = await ethers.provider.getBlock(tx.blockNumber);
      let oneOrMoreSecondsLater = block.timestamp + 1;
      console.log("oneOrMoreSecondsLater:", oneOrMoreSecondsLater);
      interest = await EURDC.callStatic.updateInterest(
        recipientAddress,
        oneOrMoreSecondsLater
      );
      console.log(
        "interest one or more seconds later on recipient's balance:",
        ethers.utils.formatUnits(interest, 27)
      );
      assert(ethers.utils.formatUnits(interest, 27) > 0);
    });
  });

  describe("setInterest function", async function () {
    let newRateInRayFormatted, oldBalance;
    before(async function () {
      oldBalance = await EURDC.balanceOf(deployerAddress);
      const newRate = 0.2;
      newRateInRayFormatted = getRateInRayFormatted(newRate);
      let tx = await EURDC.setInterestRate(newRateInRayFormatted);
      await tx.wait();
    });

    it("should set interest rate to new rate", async function () {
      const rateInRay = await EURDC.rateInRay();
      assert.equal(Number(rateInRay), Number(newRateInRayFormatted));
    });

    it("should add accrued interest to balance", async function () {
      const newBalance = await EURDC.balanceOf(deployerAddress);
      console.log("oldBalance", oldBalance);
      console.log("newBalance", newBalance);
      assert(oldBalance < newBalance);
    });
    it("should set interest to zero", async function () {
      const interestDeployer = await EURDC.getInterest(deployerAddress);
      assert.equal(interestDeployer, 0);
    });
  });

  //still to test transferFrom
});

// const intervalOne = setInterval(async () => {
//   interestNewSolidity = await EURDC.callStatic.updateInterest(
//     deployerAddress,
//     Math.floor(Date.now() / 1000)
//   );
//   console.log(
//     "Logging interest deployer:",
//     ethers.utils.formatUnits(interestNewSolidity, 27)
//   );
//   assert(interestNewSolidity > interestOld);
//   if (++counter > 10) clearInterval(intervalOne);
//   interestOld = interestNewSolidity;
// }, 1000);
