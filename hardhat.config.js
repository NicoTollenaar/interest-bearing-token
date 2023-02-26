require("@nomiclabs/hardhat-waffle");
require("dotenv").config();

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
  solidity: "0.8.17",
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
      blockGasLimit: 12450000,
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
