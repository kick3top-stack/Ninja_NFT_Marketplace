const { expect } = require("chai");
const { loadFixture, time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");

describe("NFTMarketplace", function () {

  async function deployFixture() {
    const [owner, seller, buyer, bidder1, bidder2] = await ethers.getSigners();

    // Deploy NFT
    const NFT = await ethers.getContractFactory("NFT");
    const nft = await NFT.deploy();
    await nft.waitForDeployment();

    // Deploy Marketplace
    const Marketplace = await ethers.getContractFactory("NFTMarketplace");
    const marketplace = await Marketplace.deploy();
    await marketplace.waitForDeployment();

    return { nft, marketplace, owner, seller, buyer, bidder1, bidder2 };
  }

  describe("Listings", function () {

    it("allows owner to list NFT", async function () {
      const { nft, marketplace, seller } = await loadFixture(deployFixture);

      await nft.connect(seller).mintNFT(
        "ipfs://token1",
        "Collection1",
        { value: ethers.parseEther("0.01") }
      );

      await nft.connect(seller).approve(marketplace.target, 0);

      await marketplace.connect(seller).listItem(
        nft.target,
        0,
        ethers.parseEther("1")
      );

      const listing = await marketplace.getListing(nft.target, 0);
      expect(listing.price).to.equal(ethers.parseEther("1"));
      expect(listing.seller).to.equal(seller.address);
    });

    it("allows buyer to buy listed NFT", async function () {
      const { nft, marketplace, seller, buyer } = await loadFixture(deployFixture);

      await nft.connect(seller).mintNFT(
        "ipfs://token1",
        "Collection1",
        { value: ethers.parseEther("0.01") }
      );

      await nft.connect(seller).approve(marketplace.target, 0);

      await marketplace.connect(seller).listItem(
        nft.target,
        0,
        ethers.parseEther("1")
      );

      await marketplace.connect(buyer).buyItem(
        nft.target,
        0,
        { value: ethers.parseEther("1") }
      );

      expect(await nft.ownerOf(0)).to.equal(buyer.address);
    });

    it("allows seller to cancel listing", async function () {
      const { nft, marketplace, seller } = await loadFixture(deployFixture);

      await nft.connect(seller).mintNFT(
        "ipfs://token1",
        "Collection1",
        { value: ethers.parseEther("0.01") }
      );

      await nft.connect(seller).approve(marketplace.target, 0);

      await marketplace.connect(seller).listItem(
        nft.target,
        0,
        ethers.parseEther("1")
      );

      await marketplace.connect(seller).cancelListing(nft.target, 0);

      const listing = await marketplace.getListing(nft.target, 0);
      expect(listing.price).to.equal(0);
    });
  });

  describe("Auctions", function () {

    it("allows owner to create auction", async function () {
      const { nft, marketplace, seller } = await loadFixture(deployFixture);

      await nft.connect(seller).mintNFT(
        "ipfs://token1",
        "Collection1",
        { value: ethers.parseEther("0.01") }
      );

      await nft.connect(seller).approve(marketplace.target, 0);

      await marketplace.connect(seller).createAuction(
        nft.target,
        0,
        ethers.parseEther("0.5"),
        3600
      );

      const auction = await marketplace.auctions(nft.target, 0);
      expect(auction.minBid).to.equal(ethers.parseEther("0.5"));
      expect(auction.seller).to.equal(seller.address);
    });

    it("allows bidding and ending auction", async function () {
      const { nft, marketplace, seller, bidder1, bidder2 } = await loadFixture(deployFixture);

      await nft.connect(seller).mintNFT(
        "ipfs://token1",
        "Collection1",
        { value: ethers.parseEther("0.01") }
      );

      await nft.connect(seller).approve(marketplace.target, 0);

      await marketplace.connect(seller).createAuction(
        nft.target,
        0,
        ethers.parseEther("0.5"),
        3600
      );

      await marketplace.connect(bidder1).bid(
        nft.target,
        0,
        { value: ethers.parseEther("0.6") }
      );

      await marketplace.connect(bidder2).bid(
        nft.target,
        0,
        { value: ethers.parseEther("0.8") }
      );

      await time.increase(3601);

      await marketplace.connect(seller).endAuction(nft.target, 0);

      expect(await nft.ownerOf(0)).to.equal(bidder2.address);
    });

    it("reverts if bid is too low", async function () {
      const { nft, marketplace, seller, bidder1 } = await loadFixture(deployFixture);

      await nft.connect(seller).mintNFT(
        "ipfs://token1",
        "Collection1",
        { value: ethers.parseEther("0.01") }
      );

      await nft.connect(seller).approve(marketplace.target, 0);

      await marketplace.connect(seller).createAuction(
        nft.target,
        0,
        ethers.parseEther("1"),
        3600
      );

      await expect(
        marketplace.connect(bidder1).bid(
          nft.target,
          0,
          { value: ethers.parseEther("0.5") }
        )
      ).to.be.reverted;
    });
  });
});
