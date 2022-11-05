// for chain details see https://chainlist.org/
// https://chainid.network/chains.json

const networks = [
  {
    chainId: "0x7a69",
    chainName: "hardhat",
    rpcUrls: ["https://localhost:8545"],
  },
  {
    chainName: "rinkeby",
    rpcUrls: ["https://rinkeby.infura.io/v3/"],
    nativeCurrency: {
      name: "Rinkeby Ether",
      symbol: "RIN",
      decimals: 18,
    },
    chainId: "0x4",
    blockEexplorerUrls: ["https://rinkeby.etherscan.io"],
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
  {
    chainId: "0x539",
    chainName: "ganache",
    rpcUrls: ["https://localhost:7545"],
  },
];

export default networks;
