// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// A contrived example of a contract that can be upgraded
contract Demo {
    string public name;

    function version() public pure returns (string memory) {
        return "1.0.0";
    }

    function setName(string memory _name) public {
        name = _name;
    }
}
