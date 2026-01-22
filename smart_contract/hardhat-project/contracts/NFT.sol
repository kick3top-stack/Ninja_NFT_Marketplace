// SPDX-License-Identifier: MIT
////////NFT.sol///////////////////// 
///////0xe2137EA89E844Db61377DABA16398d3999b29E45 deployed

pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "hardhat/console.sol";

contract NFT is ERC721URIStorage, ERC2981, Ownable { 
    uint256 public tokenCounter;
    uint256 public constant MINT_PRICE = 0.01 ether;

    // tokenId => collection label
    mapping(uint256 => string) public collections;

    // Events
    event Minted(address indexed user, uint256 tokenId, string collectionName);
    event FreeTransfer(address indexed from, address indexed to, uint256 tokenId);

    constructor() ERC721("MyNFTCollection", "MNFT") Ownable(msg.sender) {
        tokenCounter = 0;
        console.log("log-----Deployed");
        _setDefaultRoyalty(msg.sender, 500);
    }

    // -------------------------------
    // Public minting
    // -------------------------------
    function mintNFT(string memory tokenURI, string memory collectionName) external payable returns (uint256) {
        require(msg.value == MINT_PRICE, "Incorrect ETH sent");
        require(bytes(collectionName).length > 0, "Collection name required");

        uint256 tokenId = tokenCounter;

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);
        collections[tokenId] = collectionName;

        tokenCounter++;

        emit Minted(msg.sender, tokenId, collectionName);
        console.log("log----%s's %s minted into %s", msg.sender, tokenId, collectionName);

        return tokenId;
    }

    // -------------------------------
    // Free transfer by owner
    // -------------------------------
    function freeTransfer(uint256 tokenId, address to) external {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        require(to != address(0), "Invalid recipient");

        _transfer(msg.sender, to, tokenId);

        emit FreeTransfer(msg.sender, to, tokenId);
        console.log("%s transfered %s into %s", msg.sender, tokenId, to);
    }

    // -------------------------------
    // Withdraw ETH (owner only)
    // -------------------------------
    function withdraw(address payable to) external onlyOwner {
        require(to != address(0), "Invalid address");
        console.log("%s ETH returned into owner.", address(this).balance / 1e18);
        to.transfer(address(this).balance);
    }

    // -------------------------------
    // Royalty functions
    // -------------------------------
    function setTokenRoyalty(uint256 tokenId, address recipient, uint96 fraction) external onlyOwner {
        _setTokenRoyalty(tokenId, recipient, fraction);
    }

    // ERC2981 interface support
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721URIStorage, ERC2981) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
