// SPDX-License-Identifier: MIT
////////NFTMarketplace.sol/////////////////////
///0x31F5eB924c124a8A34379fc1A5e86E986F9c0890---seplia contract adress

pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "hardhat/console.sol";

contract Marketplace {
    struct Listing {
        uint256 price;
        address seller;
    }

    struct Auction {
        address seller;
        uint256 minBid;
        uint256 highestBid;
        address highestBidder;
        uint256 endTime;
        bool ended;
    }

    mapping(address => mapping(uint256 => Listing)) public listings;
    mapping(address => mapping(uint256 => Auction)) public auctions;

    bool private locked;

    // Events
    event ItemListed(address indexed tokenAddress, uint256 indexed tokenId, address indexed seller, uint256 price);
    event ItemBought(address indexed tokenAddress, uint256 indexed tokenId, address indexed buyer, uint256 price);
    event ItemCanceled(address indexed tokenAddress, uint256 indexed tokenId, address indexed seller);

    event AuctionCreated(address indexed tokenAddress, uint256 indexed tokenId, uint256 minBid, uint256 endTime);
    event BidPlaced(address indexed tokenAddress, uint256 indexed tokenId, address indexed bidder, uint256 amount);
    event AuctionEnded(address indexed tokenAddress, uint256 indexed tokenId, address winner, uint256 amount);

    modifier noReentrant() {
        require(!locked, "Reentrancy detected");
        locked = true;
        _;
        locked = false;
    }

    // -------------------------------
    // List NFT for sale
    // -------------------------------
    function listItem(address tokenAddress, uint256 tokenId, uint256 price) external {
        require(price > 0, "Price must be > 0");

        IERC721 token = IERC721(tokenAddress);
        require(token.ownerOf(tokenId) == msg.sender, "Not the owner");
        require(
            token.getApproved(tokenId) == address(this) || token.isApprovedForAll(msg.sender, address(this)),
            "Marketplace not approved"
        );

        listings[tokenAddress][tokenId] = Listing(price, msg.sender);

        emit ItemListed(tokenAddress, tokenId, msg.sender, price);
        console.log("%s's token-%s was completely listed into %s ETH.",msg.sender, tokenId, price / 1e18);
    }

    // -------------------------------
    // Buy NFT (with royalties)
    // -------------------------------
    function buyItem(address tokenAddress, uint256 tokenId) external payable noReentrant {
        Listing memory item = listings[tokenAddress][tokenId];
        require(item.price > 0, "NFT not for sale");
        require(msg.value == item.price, "Send exact ETH");

        delete listings[tokenAddress][tokenId];

        IERC721(tokenAddress).safeTransferFrom(item.seller, msg.sender, tokenId);

        // Handle royalties
        uint256 royaltyAmount = 0;
        address royaltyReceiver;

        if (ERC2981(tokenAddress).supportsInterface(type(IERC2981).interfaceId)) {
            (royaltyReceiver, royaltyAmount) = ERC2981(tokenAddress).royaltyInfo(tokenId, msg.value);
        }

        if (royaltyAmount > 0 && royaltyReceiver != address(0)) {
            payable(royaltyReceiver).transfer(royaltyAmount);
            payable(item.seller).transfer(msg.value - royaltyAmount);
        } else {
            payable(item.seller).transfer(msg.value);
        }

        emit ItemBought(tokenAddress, tokenId, msg.sender, item.price);
        console.log("%s bought %s for %s ETH.",msg.sender, tokenId, item.price / 1e18);
    }

    // -------------------------------
    // Cancel listing
    // -------------------------------
    function cancelListing(address tokenAddress, uint256 tokenId) external {
        Listing memory item = listings[tokenAddress][tokenId];
        require(item.seller == msg.sender, "Not seller");

        delete listings[tokenAddress][tokenId];

        emit ItemCanceled(tokenAddress, tokenId, msg.sender);
        console.log("%s list canceled %s", msg.sender, tokenId);
    }

    // -------------------------------
    // Auctions
    // -------------------------------
    function createAuction(address tokenAddress, uint256 tokenId, uint256 minBid, uint256 duration) external {
        IERC721 token = IERC721(tokenAddress);
        require(token.ownerOf(tokenId) == msg.sender, "Not owner");
        require(duration > 0, "Invalid duration");

        auctions[tokenAddress][tokenId] = Auction({
            seller: msg.sender,
            minBid: minBid,
            highestBid: 0,
            highestBidder: address(0),
            endTime: block.timestamp + duration,
            ended: false
        });

        emit AuctionCreated(tokenAddress, tokenId, minBid, block.timestamp + duration);
    }

    function bid(address tokenAddress, uint256 tokenId) external payable noReentrant {
        Auction storage a = auctions[tokenAddress][tokenId];
        require(block.timestamp < a.endTime, "Auction ended");
        require(msg.value >= a.minBid && msg.value > a.highestBid, "Bid too low");

        // Refund previous highest bidder
        if (a.highestBidder != address(0)) {
            payable(a.highestBidder).transfer(a.highestBid);
        }

        a.highestBid = msg.value;
        a.highestBidder = msg.sender;

        emit BidPlaced(tokenAddress, tokenId, msg.sender, msg.value);
    }

    function endAuction(address tokenAddress, uint256 tokenId) external noReentrant {
        Auction storage a = auctions[tokenAddress][tokenId];
        require(block.timestamp >= a.endTime, "Auction not yet ended");
        require(!a.ended, "Auction already ended");

        a.ended = true;

        if (a.highestBidder != address(0)) {
            IERC721(tokenAddress).safeTransferFrom(a.seller, a.highestBidder, tokenId);

            // Royalty payout
            uint256 royaltyAmount = 0;
            address royaltyReceiver;

            if (ERC2981(tokenAddress).supportsInterface(type(IERC2981).interfaceId)) {
                (royaltyReceiver, royaltyAmount) = ERC2981(tokenAddress).royaltyInfo(tokenId, a.highestBid);
            }

            if (royaltyAmount > 0 && royaltyReceiver != address(0)) {
                payable(royaltyReceiver).transfer(royaltyAmount);
                payable(a.seller).transfer(a.highestBid - royaltyAmount);
            } else {
                payable(a.seller).transfer(a.highestBid);
            }
        }

        emit AuctionEnded(tokenAddress, tokenId, a.highestBidder, a.highestBid);
    }

    // -------------------------------
    // View listing
    // -------------------------------
    function getListing(address tokenAddress, uint256 tokenId) external view returns (Listing memory) {
        return listings[tokenAddress][tokenId];
    }
}
