import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

import proxyModule from "./ProxyModule";

const upgradeModule = buildModule("UpgradeModule", (m) => {
  const proxyAdminOwner = m.getAccount(0);

  const { proxyAdmin, proxy } = m.useModule(proxyModule);

  const NFTCollectionV2 = m.contract("NFTCollectionV2");
  
  m.call(proxyAdmin, "upgradeAndCall", [proxy, NFTCollectionV2, "0x"], {
    from: proxyAdminOwner,
  });

  return { proxyAdmin, proxy };
});

const demoV2Module = buildModule("NFTCollectionV2Module", (m) => {
  const { proxy } = m.useModule(upgradeModule);

  const NFTCollectionV2 = m.contractAt("NFTCollectionV2", proxy);
  return { NFTCollectionV2 };
});

export default demoV2Module;
