# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

ETHER SCAN API KEY: FRA9DM7T7U1RHUBBRJ3A3MP8B2MMH2Q73S

Try running some of the following tasks:
```shell
npx hardhat typechain

npx hardhat vars set PRIVATE_KEY
npx hardhat vars set INFURA_API_KEY

npx hardhat vars list
npx hardhat vars delete PRIVATE_KEY

npx hardhat ignition deploy ./ignition/modules/Lock.ts --network localhost

npx hardhat ignition deploy ./ignition/modules/ProxyModule.ts --network polygon --verify
npx hardhat ignition verify chain-137 --include-unrelated-contracts


npx hardhat test
npx hardhat compile
npx hardhat node
```
