import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export const proxyModule = buildModule("SocialMediaVerificationProxyModule", (m) => {
  const proxyAdminOwner = m.getAccount(0);

  const demo = m.contract("SocialMediaVerification");

  // We do not need function here
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

const demoModule = buildModule("SocialMediaVerificationModule", (m) => {
  const { proxy, proxyAdmin } = m.useModule(proxyModule);

  const demo = m.contractAt("SocialMediaVerification", proxy);

  return { demo, proxy, proxyAdmin };
});

export default demoModule;
