require("@nomiclabs/hardhat-waffle");
require("dotenv").config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.4",
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
      blockGasLimit: 12450000,
    },
    ganache: {
      url: "http://localhost:7545",
      accounts: [
        `0x${process.env.GANANCHE_PRIVATE_KEY_ONE}`,
        `0x${process.env.GANANCHE_PRIVATE_KEY_TWO}`,
      ],
    },
    rinkeby: {
      url: `${process.env.ALCHEMY_RINKEBY_URL}`,
      accounts: [
        `0x${process.env.RINKEBY_PRIVATE_KEY_ONE}`,
        `0x${process.env.RINKEBY_PRIVATE_KEY_TWO}`,
      ],
    },
    goerli: {
      url: `${process.env.ALCHEMY_GOERLI_URL}`,
      accounts: [
        `0x${process.env.GOERLI_PRIVATE_KEY_ONE}`,
        `0x${process.env.GOERLI_PRIVATE_KEY_TWO}`,
      ],
    },
  },
  paths: {
    artifacts: "./src/artifacts",
  },
};
