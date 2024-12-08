import { expect } from "chai";
import { ignition, ethers } from "hardhat";

import ProxyModule from "../ignition/modules/ProxyModule";
import UpgradeModule from "../ignition/modules/UpgradeModule";
import { Demo, DemoV2 } from "../typechain-types";

describe("Demo Proxy", function () {
  // describe("Proxy interaction", async function () {
  //   it("Should be interactable via proxy", async function () {
  //     const [, otherAccount] = await ethers.getSigners();

  //     const { demo } = await ignition.deploy(ProxyModule);
  //     const demoContract = demo as unknown as Demo;

  //     expect(await demoContract.connect(otherAccount).version()).to.equal("1.0.0");
  //   });
  // });

  describe("Upgrading", function () {
    // it("Should have upgraded the proxy to DemoV2", async function () {
    //   const [, otherAccount] = await ethers.getSigners();

    //   const { demo } = await ignition.deploy(UpgradeModule);
    //   const demoContract = demo as unknown as DemoV2;

    //   expect(await demoContract.connect(otherAccount).version()).to.equal("2.0.0");
    // });

    // it("Should have set the name during upgrade", async function () {
    //   const [, otherAccount] = await ethers.getSigners();

    //   const { demo } = await ignition.deploy(UpgradeModule);
    //   const demoContract = demo as unknown as DemoV2;

    //   expect(await demoContract.connect(otherAccount).name()).to.equal("Example Name");
    // });
    it("Old value still accesable after upgrade", async function () {
      const [, otherAccount] = await ethers.getSigners();

      const { demo: oldDemo } = await ignition.deploy(ProxyModule);
      const oldDemoContract = oldDemo as unknown as DemoV2;

      await oldDemoContract.setName("Example Name v1");

      expect(await oldDemoContract.connect(otherAccount).name()).to.equal("Example Name v1");

      const { demo: newDemo } = await ignition.deploy(UpgradeModule);
      const newDemoContract = newDemo as unknown as DemoV2;

      expect(await newDemoContract.connect(otherAccount).name()).to.equal("Example Name v1");

      // expect(await demoContract.connect(otherAccount).name()).to.equal("Example Name");
    });
  });
});
