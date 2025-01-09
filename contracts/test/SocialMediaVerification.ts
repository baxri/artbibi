import { expect } from "chai";
import hre from "hardhat";

describe("SocialMediaVerification", function () {
  async function deploySocialMediaVerificationFixture() {
    const [owner, verifier, user1, user2] = await hre.ethers.getSigners();

    const SocialMediaVerification = await hre.ethers.getContractFactory(
      "SocialMediaVerification"
    );
    const socialMediaVerification = await SocialMediaVerification.deploy();

    await socialMediaVerification.initialize();
    await socialMediaVerification.connect(owner).setVerifier(verifier.address);

    return { socialMediaVerification, owner, verifier, user1, user2 };
  }

  // Helper function to initiate verification and get requestId
  async function initiateVerification(
    socialMediaVerification: any,
    user: any,
    username: string,
    platform: string
  ) {
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
    const requestId = await initiateVerification(
      socialMediaVerification,
      user,
      username,
      platform
    );

    const message = hre.ethers.solidityPackedKeccak256(
      ["bytes32", "address", "string", "string"],
      [requestId, user.address, username, platform]
    );
    const signature = await verifier.signMessage(hre.ethers.getBytes(message));

    await socialMediaVerification
      .connect(user)
      .confirmVerification(requestId, username, platform, signature);

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

      const requestId = await initiateVerification(
        socialMediaVerification,
        user1,
        username,
        platform
      );

      const res = await socialMediaVerification.verificationRequests(requestId);

      expect(res[0]).to.equal(user1.address);
    });

    it("Should confirm verification with valid signature", async function () {
      const { socialMediaVerification, verifier, user1 } =
        await deploySocialMediaVerificationFixture();

      const username = "testuser";
      const platform = "twitter";

      await verifyAccount(
        socialMediaVerification,
        verifier,
        user1,
        username,
        platform
      );

      // Check account is registered
      const accounts = await socialMediaVerification.getUserSocialAccounts(
        user1.address
      );
      expect(accounts.length).to.equal(1);
      expect(accounts[0].username).to.equal(username);
      expect(accounts[0].platform).to.equal(platform);
      expect(accounts[0].isVerified).to.be.true;
    });

    it("Should revert verification if verifier is wrong", async function () {
      const { socialMediaVerification, verifier, user1 } =
        await deploySocialMediaVerificationFixture();

      const username = "testuser";
      const platform = "twitter";

      const receipt = verifyAccount(
        socialMediaVerification,
        user1, // Set wrong verifier
        user1,
        username,
        platform
      );

      await expect(receipt).to.be.revertedWith("Invalid verifier signature");
    });

    it("Should not confirm verification if it is already confirmed or wrong request", async function () {
      const { socialMediaVerification, verifier, user1 } =
        await deploySocialMediaVerificationFixture();

      const username = "testuser";
      const platform = "twitter";

      await verifyAccount(
        socialMediaVerification,
        verifier,
        user1,
        username,
        platform
      );

      await expect(
         verifyAccount(
          socialMediaVerification,
          verifier,
          user1,
          username,
          platform
        )
      ).to.be.revertedWith("Platform already registered");
    });

    it("Should register post and return hash for verification", async function () {
      const { socialMediaVerification, user1, verifier } =
        await deploySocialMediaVerificationFixture();

      const username = "testuser";
      const platform = "twitter";
      const postUrl = "https://twitter.com/testuser/status/123456789";

      // First verify the account
      await verifyAccount(
        socialMediaVerification,
        verifier,
        user1,
        username,
        platform
      );

      // Register the post and get the transaction
      const tx = await socialMediaVerification
        .connect(user1)
        .registerPost(postUrl, platform);

      const receipt = await tx.wait();

      const events = receipt!.logs.map((log: any) =>
        socialMediaVerification.interface.parseLog(log)
      );

      const postHash = events[0]?.args?.postHash;

      // Verify the post exists and details are correct
      const postInfo = await socialMediaVerification.verifyPost(postHash);

      expect(postInfo.exists).to.be.true;
      expect(postInfo.author).to.equal(user1.address);
      expect(postInfo.platform).to.equal(platform);
      expect(postInfo.authorUsername).to.equal(username);
      expect(postInfo.timestamp).to.be.gt(0);
      expect(postInfo.postUrl).to.equal(postUrl);

      // Verify the post exists and details are correct
      const userPosts = await socialMediaVerification.getUserPosts(user1?.address);

      expect(userPosts.length).to.equal(1);
      expect(userPosts[0].postHash).to.equal(postHash);
      expect(userPosts[0].authorUsername).to.equal(username);
      expect(userPosts[0].platform).to.equal(platform);

       // Verify the post exists and details are correct
       const allPosts = await socialMediaVerification.getAllPosts();

       expect(allPosts.length).to.equal(1);
       expect(allPosts[0].postHash).to.equal(postHash);
       expect(allPosts[0].authorUsername).to.equal(username);
       expect(allPosts[0].platform).to.equal(platform);
    });
  });
});
