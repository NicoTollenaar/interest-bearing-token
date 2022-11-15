// for chain details see https://chainlist.org/
// https://chainid.network/chains.json

const networks = [
  {
    chainId: "0x7a69",
    chainName: "hardhat",
    rpcUrls: ["https://localhost:8545"],
  },
  {
    chainName: "goerli",
    rpcUrls: ["https://goerli.infura.io/v3/"],
    nativeCurrency: {
      name: "Görli Ether",
      symbol: "GOR",
      decimals: 18,
    },
    chainId: "0x5",
    blockExplorerUrls: ["https://goerli.etherscan.io"],
  },
];

export default networks;
