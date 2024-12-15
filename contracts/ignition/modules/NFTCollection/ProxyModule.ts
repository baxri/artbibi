import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export const proxyModule = buildModule("ProxyModule", (m) => {
  const proxyAdminOwner = m.getAccount(0);

  const demo = m.contract("NFTCollection");

  const initializeData = m.encodeFunctionCall(demo, "initialize", []);

  const proxy = m.contract("TransparentUpgradeableProxy", [
    demo,
    proxyAdminOwner,
    initializeData, //"0x",
  ]);

  const proxyAdminAddress = m.readEventArgument(
    proxy,
    "AdminChanged",
    "newAdmin"
  );

  const proxyAdmin = m.contractAt("ProxyAdmin", proxyAdminAddress);

  return { proxyAdmin, proxy };
});

const demoModule = buildModule("NFTCollectionModule", (m) => {
  const { proxy, proxyAdmin } = m.useModule(proxyModule);

  const demo = m.contractAt("NFTCollection", proxy);

  return { demo, proxy, proxyAdmin };
});

export default demoModule;
