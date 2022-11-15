# Interest-bearing-token

ERC20 token that bears interest compounding per second (using DSMath library)

# To run app:

1. Clone repo (default branch main)
2. Change directory into project folder (`cd interest-bearing-token`)
3. `npm install` (package.json)
4. Open and review hardhat.config file (look at which environment variables are needed)
5. Create a .env file in the same directory has hardhat.config and add the required environment variables (Alchemy provider url and private keys for Goerli network)
6. Open two extra terminals and navigate to project directory (one for react app, one for running hardhat network, one for executing commands)
7. In one terminal run `npx hardhat node`. This should start the hardhat network providing 10 accounts with test ETH
8. In another terminal start the react-app ('npm start')
9. In the third terminal deploy the contract to the hardhat and goerli networks using 'npx hardhat run scripts/deploy.js --network localhost' and 'npx hardhat run scripts/deploy.js --network goerli'.
10. The contract will be deployed by the signer associated to the first private key that you entered into the hardhat.config file. Make sure this account has sufficient test ETH for deployment (using Goerli faucet)
11. Add hardhat network to MetaMask. Go to settings -> networks -> add network. Network name: "hardhat" (all lowercase), RPC URL: "http://127.0.0.1:8545/", Chain ID: "31337", Currency symbol: "GO"
12. The app should now run on http://localhost:3000.
13. Make sure you use connect accounts with sufficient test ETH. For hardhat you might have to import accounts into MetaMask (the private keys are listed in the terminal running npx hardhat node). Close the browser tab in which the app is running to pause the terminal. For Goerli you might have to get test ETH using the Goerli faucet.
14. Import the EURDC token into the MetaMask accounts by clicking "Assets" -> "Import token" and then entering the contract address (should appear in at the top of the app page running in the browser).
15. NB: after every time that you have stopped and restarted the local hardhat network (`npx hardhat node`) you will have to redeploy the contract to the new (restarted) hardhat network (`npx hardhat run scripts/deploy.js`).
16. You always need to manually make sure that the correct account is connected. The app does not do this automatically in all circumstances (yet).
17. It is sometimes necessary to reset MetaMask accounts. If needed, go to settings -> advanced -> reset account.
18. On Goerli EURDC can be transferred both through the app interface or MetaMask. Sending EURDC through MetaMask is not supported on hardhat. On the hardhat network all transfers must be made through the app interface.

You might run into errors when using the latest version of node (version 17 at the time of writing). Using nvm (install if necessary) switch to an earlier version of node. At the time of writing version 16 works for me (using command `nvm use 16`)
