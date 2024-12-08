import { expect } from "chai";
import { ignition, ethers } from "hardhat";

import ProxyModule from "../ignition/modules/ProxyModule";
import UpgradeModule from "../ignition/modules/UpgradeModule";
import { Demo, DemoV2 } from "../typechain-types";

describe("Demo Proxy", function () {
  describe("Proxy interaction", async function () {
    it("Should be interactable via proxy", async function () {
      const [, otherAccount] = await ethers.getSigners();

      const { demo } = await ignition.deploy(ProxyModule);
      const demoContract = demo as unknown as Demo;

      expect(await demoContract.connect(otherAccount).version()).to.equal("1.0.0");
    });
  });

  describe("Upgrading", function () {
    it("Should have upgraded the proxy to DemoV2", async function () {
      const [, otherAccount] = await ethers.getSigners();

      const { demo } = await ignition.deploy(UpgradeModule);
      const demoContract = demo as unknown as DemoV2;

      expect(await demoContract.connect(otherAccount).version()).to.equal("2.0.0");
    });
  });
});
