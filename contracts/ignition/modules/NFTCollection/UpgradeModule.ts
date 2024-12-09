import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

import proxyModule from "./ProxyModule";

const upgradeModule = buildModule("UpgradeModule", (m) => {
  const proxyAdminOwner = m.getAccount(0);

  const { proxyAdmin, proxy } = m.useModule(proxyModule);

  const demoV2 = m.contract("NFTCollection");

  // const encodedFunctionCall = m.encodeFunctionCall(demoV2, "setName", [
  //   "Example Name",
  // ]);

  m.call(proxyAdmin, "upgradeAndCall", [proxy, demoV2, "0x"], {
    from: proxyAdminOwner,
  });

  return { proxyAdmin, proxy };
});

const demoV2Module = buildModule("NFTCollectionV2Module", (m) => {
  const { proxy } = m.useModule(upgradeModule);

  const demo = m.contractAt("NFTCollection", proxy);

  return { demo };
});

export default demoV2Module;
