//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "../lib/DSMath.sol";

contract EURDC is ERC20, ERC20Burnable {
    uint public rateInRay;
    mapping(address => uint) public interest;
    mapping(address => uint) public lastTimestamp;

    constructor(uint _rateInRay, uint _compoundPeriod)
        ERC20("EURO Deposit Coin", "EURDC")
    {
        rateInRay = _rateInRay;
    }

    function decimals() public pure override returns (uint8) {
        return 18;
    }

    function mulDiv(
        uint x,
        uint y,
        uint z
    ) public pure returns (uint) {
        uint a = x / z;
        uint b = x % z; // x = a * z + b
        uint c = y / z;
        uint d = y % z; // y = c * z + d
        return a * b * z + a * d + b * c + (b * d) / z;
    }

    function setInterestRate(uint _rateInRay)
        public
        payable
        returns (bool)
    {
        rateInRay = _rateInRay;
        return true;
    }

    function issue(address recipient, uint amount) public {
        updateInterest(recipient);
        addInterestToBalance(recipient);
        _mint(recipient, amount);
    }

    function updateInterest(address depositor) public returns (uint) {
        if (lastTimestamp[depositor] == 0) {
            lastTimestamp[depositor] = block.timestamp;
        }
        uint timeLapsed = block.timestamp - lastTimestamp[depositor];
        interest[depositor] = mulDiv((rateInRay *timeLapsed), balanceOf(depositor),(yearInSeconds*100));
        console.log("Block number:", block.number);
        console.log("Block timestamp:", block.timestamp);
        console.log("Timelapsed:", timeLapsed);
        console.log(
            "interest[depositor]:",
            interest[depositor]
        );
        return interest[depositor];
    }

    function getInterest(address depositor) public view returns (uint) {
        return interest[depositor];
    }

    function transfer(address to, uint256 amount)
        public
        virtual
        override
        returns (bool)
    {
        updateInterest(msg.sender);
        addInterestToBalance(msg.sender);
        updateInterest(to);
        addInterestToBalance(to);
        super.transfer(to, amount);
        return true;
    }

    function addInterestToBalance(address depositor) public payable {
        updateInterest(depositor);
        _balances[depositor] += interest[depositor];
        interest[depositor] = 0;
        lastTimestamp[depositor] = block.timestamp;
    }
}
