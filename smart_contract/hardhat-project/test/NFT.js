const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");

describe("NFT — Public Mint + FreeTransfer", function () {

  // Fixture function to deploy the contract
  async function deployFixture() {
    const [owner, user1, user2] = await ethers.getSigners();
    const NFT = await ethers.getContractFactory("NFT"); 
    const nft = await NFT.deploy();
    await nft.waitForDeployment();
    return { nft, owner, user1, user2 };
  }

  // Testing the deployment logic
  describe("Deployment", function () {
    it("starts tokenCounter at 0", async function () {
      const { nft } = await loadFixture(deployFixture);
      expect(await nft.tokenCounter()).to.equal(0);
    });
  });

  // Testing the minting logic
  describe("Public minting", function () {
    it("allows users to mint with correct ETH", async function () {
      const { nft, owner, user1 } = await loadFixture(deployFixture);

      // Mint 3 NFTs
      await nft.connect(user1).mintNFT("ipfs://token1", "Collection1", { value: ethers.parseEther("0.01") });
      await nft.connect(user1).mintNFT("ipfs://token2", "Collection1", { value: ethers.parseEther("0.01") });
      await nft.connect(user1).mintNFT("ipfs://token3", "Collection2", { value: ethers.parseEther("0.01") });

      // Check token ownership and collection name
      expect(await nft.ownerOf(0)).to.equal(user1.address);
      expect(await nft.collections(0)).to.equal("Collection1");
      expect(await nft.tokenCounter()).to.equal(3);
    });

    it("reverts if ETH is incorrect", async function () {
      const { nft, user1 } = await loadFixture(deployFixture);

      await expect(
        nft.connect(user1).mintNFT("ipfs://token2", "Collection1", { value: ethers.parseEther("0.001") })
      ).to.be.revertedWith("Incorrect ETH sent");
    });

    it("reverts if collectionName is empty", async function () {
      const { nft, user1 } = await loadFixture(deployFixture);

      await expect(
        nft.connect(user1).mintNFT("ipfs://token3", "", { value: ethers.parseEther("0.01") })
      ).to.be.revertedWith("Collection name required");
    });
  });

  // Testing the free transfer functionality
  describe("Free transfer", function () {
    it("allows owner to transfer NFT freely", async function () {
      const { nft, user1, user2 } = await loadFixture(deployFixture);

      // Mint an NFT and transfer it to another user
      await nft.connect(user1).mintNFT("ipfs://token1", "Collection1", { value: ethers.parseEther("0.01") });
      await nft.connect(user1).freeTransfer(0, user2.address);

      expect(await nft.ownerOf(0)).to.equal(user2.address);
    });

    it("reverts if non-owner tries freeTransfer", async function () {
      const { nft, user1, user2 } = await loadFixture(deployFixture);

      await nft.connect(user1).mintNFT("ipfs://token1", "Collection1", { value: ethers.parseEther("0.01") });

      await expect(
        nft.connect(user2).freeTransfer(0, user2.address)
      ).to.be.revertedWith("Not token owner");
    });
  });

  // Testing the withdraw function for the contract owner
  describe("Withdraw", function () {
    it("allows owner to withdraw ETH", async function () {
      const { nft, owner, user1, user2 } = await loadFixture(deployFixture);

      await nft.connect(user1).mintNFT("ipfs://token1", "Collection1", { value: ethers.parseEther("0.01") });
      await nft.connect(user1).mintNFT("ipfs://token1", "Collection1", { value: ethers.parseEther("0.01") });
        await nft.connect(user2).mintNFT("ipfs://token1", "Collection1", { value: ethers.parseEther("0.01") });

      const balanceBefore = await ethers.provider.getBalance(owner.address);

      // Withdraw ETH from the contract
      const tx = await nft.withdraw(owner.address);
      await tx.wait();

      const balanceAfter = await ethers.provider.getBalance(owner.address);
      expect(balanceAfter).to.be.gt(balanceBefore); // Check that balance increased
    });

    it("reverts if non-owner tries to withdraw", async function () {
        const { nft, user1, user2 } = await loadFixture(deployFixture);

        
        await expect(
            nft.connect(user1).withdraw(user1.address)
        ).to.be.reverted; // just check it reverts
    });
  });
});
