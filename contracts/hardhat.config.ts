import { HardhatUserConfig, vars } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@typechain/hardhat";

const config: HardhatUserConfig = {
  solidity: "0.8.28",
   etherscan: {
    apiKey: `${vars.get('INFURA_API_KEY')}`,
  },
  networks: {
    polygon: {
      url: "https://polygon-mainnet.infura.io/v3/2MwhXM5opP53i37gwlXYvvi1J5J", 
      accounts: [`${vars.get('PRIVATE_KEY')}`], 
    },
  },
};

export default config;

