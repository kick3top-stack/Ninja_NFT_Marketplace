const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const NFTModule = buildModule("NFTModule", (m) => {
  const NFT = m.contract("NFT");

  return { NFT };
});

module.exports = NFTModule;