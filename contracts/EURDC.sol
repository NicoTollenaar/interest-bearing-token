//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "../lib/DSMath.sol";

contract EURDC is ERC20, ERC20Burnable, DSMath {
    uint public rateInRay;
    mapping(address => uint) public interest;
    mapping(address => uint) public lastTimestamp;

    constructor(uint _rateInRay) ERC20("EURO Deposit Coin", "EURDC") {
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

    function setInterestRate(uint _rateInRay) public payable returns (bool) {
        // still to do: update and add interest across all tokenholders
        rateInRay = _rateInRay;
        console.log("rateInRay:", rateInRay);
        return true;
    }

    function issue(address recipient, uint amount) public {
        updateInterest(recipient, block.timestamp);
        addInterestToBalance(recipient);
        _mint(recipient, amount);
    }

    function updateInterest(address depositor, uint currentTimestamp)
        public
        returns (uint)
    {
        uint timeLapsed;
        if (lastTimestamp[depositor] == 0) {
            lastTimestamp[depositor] = block.timestamp;
        }
        console.log("currentTimstamp:", currentTimestamp);
        console.log("block.timestamp:", block.timestamp);
        console.log("lastTimestamp[depositor]:", lastTimestamp[depositor]);
        if (currentTimestamp < lastTimestamp[depositor]) {
            timeLapsed = 0;
        } else {
            timeLapsed = sub(currentTimestamp, lastTimestamp[depositor]);
        }
        // uint timeLapsed = sub(block.timestamp, lastTimestamp[depositor]);
        uint principal = balanceOf(depositor);
        uint principalInRay = mul(principal, 10**9);
        uint interestFactor = rpow(rateInRay, timeLapsed);
        uint principalPlusInterest = rmul(principalInRay, interestFactor);
        interest[depositor] = sub(principalPlusInterest, principalInRay);
        console.log("Timelapsed:", timeLapsed);
        console.log("Principal:", principal);
        console.log("principalInRay:", principalInRay);
        console.log("principalPlusInterest:", principalPlusInterest);
        console.log("interest[depositor]:", interest[depositor]);
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
        // still to do: include and update array of tokenholders
        // (add new recipient and remove existing tokenholder if balance becomes zero)
        updateInterest(msg.sender, block.timestamp);
        addInterestToBalance(msg.sender);
        updateInterest(to, block.timestamp);
        addInterestToBalance(to);
        super.transfer(to, amount);
        return true;
    }

    function addInterestToBalance(address depositor) public payable {
        updateInterest(depositor, block.timestamp);
        _balances[depositor] += interest[depositor];
        interest[depositor] = 0;
        lastTimestamp[depositor] = block.timestamp;
    }
}
