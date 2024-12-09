import { expect } from "chai";
import hre from "hardhat";

describe("NFTCollection", function () {
  async function deployNFTCollectionFixture() {
    const [owner, buyer, anotherAccount] = await hre.ethers.getSigners();

    const NFTCollection = await hre.ethers.getContractFactory("NFTCollection");
    const nftCollection = await NFTCollection.deploy();

    return { nftCollection, owner, buyer, anotherAccount };
  }

  describe("Deployment", function () {
    it("Should set the right name and symbol", async function () {
      const { nftCollection } = await deployNFTCollectionFixture();

      expect(await nftCollection.name()).to.equal("ArtBIBI");
      expect(await nftCollection.symbol()).to.equal("BIBI");
    });

    it("Should set the deployer as the owner", async function () {
      const { nftCollection, owner } = await deployNFTCollectionFixture();

      expect(await nftCollection.owner()).to.equal(owner.address);
    });
  });

  describe("Minting NFTs", function () {
    it("Should mint an NFT and assign it to the recipient", async function () {
      const { nftCollection, owner } = await deployNFTCollectionFixture();

      const tokenURI = "https://example.com/metadata.json";
      const price = hre.ethers.parseEther("1.0");

      await nftCollection.connect(owner).mintNFT(tokenURI, price);

      expect(await nftCollection.tokenURI(1)).to.equal(tokenURI);
      expect(await nftCollection.ownerOf(1)).to.equal(owner.address);

      const nft = await nftCollection.nfts(1);

      expect(nft.price).to.equal(price);
      expect(nft.isForSale).to.be.true;
    });

    it("Should revert if a non-owner tries to mint", async function () {
      const { nftCollection, buyer } = await deployNFTCollectionFixture();

      const tokenURI = "https://example.com/metadata.json";
      const price = hre.ethers.parseEther("1.0");

      await expect(nftCollection.connect(buyer).mintNFT(tokenURI, price)).to.be
        .reverted;
    });
  });

  describe("Buying NFTs", function () {
    it("Should allow buying an NFT and transfer ownership", async function () {
      const { nftCollection, owner, buyer } =
        await deployNFTCollectionFixture();

      const tokenURI = "https://example.com/metadata.json";
      const price = hre.ethers.parseEther("1.0");

      await nftCollection.mintNFT(tokenURI, price);

      await nftCollection.connect(owner).setForSale(1, price);

      await expect(
        nftCollection.connect(buyer).buyNFT(1, { value: price })
      ).to.changeEtherBalances([owner, buyer], [price, -price]);

      expect(await nftCollection.ownerOf(1)).to.equal(buyer.address);

      const nft = await nftCollection.nfts(1);
      expect(nft.isForSale).to.be.false;
    });

    it("Should revert if the buyer sends incorrect value", async function () {
      const { nftCollection, buyer, owner } =
        await deployNFTCollectionFixture();

      const tokenURI = "https://example.com/metadata.json";
      const price = hre.ethers.parseEther("1.0");

      await nftCollection.mintNFT(tokenURI, price);
      await nftCollection.connect(owner).setForSale(1, price);

      await expect(
        nftCollection.connect(buyer).buyNFT(1, {
          value: hre.ethers.parseEther("0.5"),
        })
      ).to.be.revertedWith("Incorrect price");
    });
  });
});
