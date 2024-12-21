import { expect } from "chai";
import hre from "hardhat";

describe("SocialMediaVerification", function () {
  async function deploySocialMediaVerificationFixture() {
    const [owner, verifier, user1, user2] = await hre.ethers.getSigners();

    const SocialMediaVerification = await hre.ethers.getContractFactory(
      "SocialMediaVerification"
    );
    const socialMediaVerification = await SocialMediaVerification.deploy(
      verifier.address
    );

    return { socialMediaVerification, owner, verifier, user1, user2 };
  }

  // Helper function to initiate verification and get requestId
  async function initiateVerification(socialMediaVerification: any, user: any, username: string, platform: string) {
    const tx = await socialMediaVerification
      .connect(user)
      .initiateVerification(username, platform);
    const receipt = await tx.wait();
    const events = receipt!.logs.map((log: any) =>
      socialMediaVerification.interface.parseLog(log)
    );
    return events[0]?.args?.requestId;
  }

  // Helper function to verify account
  async function verifyAccount(
    socialMediaVerification: any,
    verifier: any,
    user: any,
    username: string,
    platform: string
  ) {
    const requestId = await initiateVerification(socialMediaVerification, user, username, platform);
    
    const message = hre.ethers.solidityPackedKeccak256(
      ["bytes32", "address", "string", "string"],
      [requestId, user.address, username, platform]
    );
    const signature = await verifier.signMessage(hre.ethers.getBytes(message));

    await socialMediaVerification.connect(user).confirmVerification(
      requestId,
      username,
      platform,
      signature
    );

    return requestId;
  }

  describe("Deployment", function () {
    it("Should set the correct verifier address", async function () {
      const { socialMediaVerification, verifier } =
        await deploySocialMediaVerificationFixture();
      expect(await socialMediaVerification.verifier()).to.equal(
        verifier.address
      );
    });
  });

  describe("Social Media Verification", function () {
    it("Should initiate verification request", async function () {
      const { socialMediaVerification, user1 } =
        await deploySocialMediaVerificationFixture();

      const username = "testuser";
      const platform = "twitter";

      const requestId = await initiateVerification(socialMediaVerification, user1, username, platform);

      const res = await socialMediaVerification.verificationRequests(requestId);

      expect(res[0]).to.equal(user1.address);
    });

    it("Should confirm verification with valid signature", async function () {
      const { socialMediaVerification, verifier, user1 } =
        await deploySocialMediaVerificationFixture();

      const username = "testuser";
      const platform = "twitter";

      await verifyAccount(socialMediaVerification, verifier, user1, username, platform);

      // Check account is registered
      const accounts = await socialMediaVerification.getUserSocialAccounts(
        user1.address
      );
      expect(accounts.length).to.equal(1);
      expect(accounts[0].username).to.equal(username);
      expect(accounts[0].platform).to.equal(platform);
      expect(accounts[0].isVerified).to.be.true;
    });

    it("Should register a post successfully", async function () {
      const { socialMediaVerification, user1, verifier } =
        await deploySocialMediaVerificationFixture();

      const username = "testuser";
      const platform = "twitter";
      const postContent = "Hello Web3!";
      const postHash = hre.ethers.keccak256(
        hre.ethers.toUtf8Bytes(postContent)
      );

      // First verify the account
      await verifyAccount(socialMediaVerification, verifier, user1, username, platform);

      // Register the post
      const postTx = await socialMediaVerification
        .connect(user1)
        .registerPost(postHash, platform);
      const postReceipt = await postTx.wait();

      const blockTimestamp = await hre.ethers.provider.getBlock("latest").then((b) => b!.timestamp);

      // Verify the PostRegistered event
      expect(postReceipt)
        .to.emit(socialMediaVerification, "PostRegistered")
        .withArgs(user1.address, postHash, blockTimestamp, platform);

      // Verify the post was stored correctly
      const post = await socialMediaVerification.posts(0);
      expect(post.author).to.equal(user1.address);
      expect(post.postHash).to.equal(postHash);
      expect(post.platform).to.equal(platform);
      expect(post.timestamp).to.be.gt(0);
    });

    it("Should fail to register post if account is not verified", async function () {
      const { socialMediaVerification, user1 } =
        await deploySocialMediaVerificationFixture();

      const platform = "twitter";
      const postContent = "Hello Web3!";
      const postHash = hre.ethers.keccak256(
        hre.ethers.toUtf8Bytes(postContent)
      );

      // Try to register post without verification
      await expect(
        socialMediaVerification.connect(user1).registerPost(postHash, platform)
      ).to.be.revertedWith("User is not verified for this platform");
    });
  });
});
