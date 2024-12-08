// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// A contrived example of a contract that can be upgraded
contract DemoV2 {
  string public name;
  string public nameV2;

  function version() public pure returns (string memory) {
    return "2.0.0";
  }

  function setName(string memory _name) public {
    name = _name;
  }

  function setNameV2(string memory _name) public {
    nameV2 = _name;
  }
}