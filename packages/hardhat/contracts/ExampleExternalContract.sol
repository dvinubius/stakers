pragma solidity 0.8.4;
//SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/access/Ownable.sol";

contract ExampleExternalContract is Ownable {
    bool public completed;

    function complete() public payable onlyOwner {
        completed = true;
    }
}
