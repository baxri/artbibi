// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721URIStorage, ERC721} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// {
//     "name": "Thor's hammer",
//     "description": "Mjölnir, the legendary hammer of the Norse god of thunder.",
//     "image": "https://game.example/item-id-8u5h2m.png",
//     "strength": 20
// }

contract NFTCollection is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    struct NFT {
        uint256 price;
        bool isForSale;
    }

    mapping(uint256 => NFT) public nfts;

    constructor() ERC721("ArtBIBI", "BIBI") Ownable(msg.sender) {
        _nextTokenId = 0;
    }

    function mintNFT(
        string memory tokenURI,
        uint256 price
    ) public onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId + 1;
        _mint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);

        nfts[tokenId] = NFT(price, true);

        return tokenId;
    }

    function buyNFT(uint256 tokenId) public payable {
        require(nfts[tokenId].isForSale, "NFT is not for sale");
        require(msg.value == nfts[tokenId].price, "Incorrect price");

        address owner = ownerOf(tokenId);

        // Update state before interacting with external addresses
        nfts[tokenId].isForSale = false;

        // Transfer the NFT to the buyer
        _transfer(owner, msg.sender, tokenId);

        // Transfer funds to the owner
        (bool sent, ) = payable(owner).call{value: msg.value}("");
        require(sent, "Failed to send Ether");
    }

    function setForSale(uint256 tokenId, uint256 price) public {
        require(ownerOf(tokenId) == msg.sender, "You are not the owner");
        nfts[tokenId].price = price;
        nfts[tokenId].isForSale = true;
    }
}
