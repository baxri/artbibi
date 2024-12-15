// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721URIStorage, ERC721} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {ERC721URIStorageUpgradeable, ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract NFTCollection is ERC721URIStorageUpgradeable, OwnableUpgradeable {
    string private _resourceBase;
    uint256 private _nextTokenId;
    struct NFT {
        uint256 price;
        bool isForSale;
    }

    mapping(uint256 => NFT) public nfts;
    mapping(uint256 => string) private _cids;

    function initialize() public initializer {
        __ERC721URIStorage_init();
        __ERC721_init("Mr. ARTBIBI", "BIBI");
        __Ownable_init(msg.sender);

        _resourceBase = "https://teal-total-pony-174.mypinata.cloud/ipfs/";
        _nextTokenId = 0;
    }

    function mintNFTWithoutPrice(
        string memory cid
    ) public onlyOwner returns (uint256) {
        uint256 tokenId = ++_nextTokenId;
        _mint(msg.sender, tokenId);
        _cids[tokenId] = cid;
        return tokenId;
    }

    function mintNFT(
        string memory cid,
        uint256 price
    ) public onlyOwner returns (uint256) {
        uint256 tokenId = ++_nextTokenId;
        _mint(msg.sender, tokenId);

        // string memory tokenURI = string(abi.encodePacked(_resourceBase, cid));
        // _setTokenURI(tokenId, tokenURI);

        _cids[tokenId] = cid;
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

    function setResourceBase(string memory resourceBase) public onlyOwner {
        _resourceBase = resourceBase;
    }

    function getResourceBase() public view returns (string memory) {
        return _resourceBase;
    }

    // Override tokenURI to dynamically construct the full URI
    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        return string.concat(_resourceBase, _cids[tokenId]);
    }
}
