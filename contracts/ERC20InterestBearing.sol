//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.17;

// import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol";

import "../lib/DSMath.sol";

contract ERC20InterestBearing is ERC20PresetMinterPauser, DSMath {
    uint public rateInRay;
    mapping(address => uint) public interest;
    mapping(address => uint) public lastTimestamp;
    address[] public tokenholders;

    constructor(
        uint _rateInRay,
        string memory name,
        string memory symbol
    ) ERC20PresetMinterPauser(name, symbol) {
        rateInRay = _rateInRay;
    }

    function getRateInRay() public view returns (uint) {
        return rateInRay;
    }

    function setInterestRate(uint _rateInRay) public payable returns (bool) {
        for (uint i = 0; i < tokenholders.length; i++) {
            addInterestToBalance(tokenholders[i]);
        }
        rateInRay = _rateInRay;
        return true;
    }

    function issue(address recipient, uint amount) public {
        if (getIndex(recipient) == -1) {
            tokenholders.push(recipient);
        }
        updateInterest(recipient, block.timestamp);
        addInterestToBalance(recipient);
        _mint(recipient, amount);
    }

    function updateInterest(
        address _tokenholder,
        uint currentTimestamp
    ) public returns (uint) {
        uint timeLapsed;
        if (lastTimestamp[_tokenholder] == 0) {
            lastTimestamp[_tokenholder] = block.timestamp;
        }
        if (currentTimestamp < lastTimestamp[_tokenholder]) {
            timeLapsed = 0;
        } else {
            timeLapsed = sub(currentTimestamp, lastTimestamp[_tokenholder]);
        }
        uint principal = balanceOf(_tokenholder);
        uint principalInRay = mul(principal, 10 ** 9);
        uint interestFactor = rpow(rateInRay, timeLapsed);
        uint principalPlusInterest = rmul(principalInRay, interestFactor);
        interest[_tokenholder] = sub(principalPlusInterest, principalInRay);
        return interest[_tokenholder];
    }

    function getInterest(address _tokenholder) public view returns (uint) {
        return interest[_tokenholder];
    }

    function getLastTimestamp(address _tokenholder) public view returns (uint) {
        return lastTimestamp[_tokenholder];
    }

    function getIndex(
        address tokenholder
    ) internal view returns (int256 index) {
        for (uint i = 0; i < tokenholders.length; i++) {
            if (tokenholders[i] == tokenholder) {
                return int(i);
            }
        }
        return -1;
    }

    function transfer(
        address to,
        uint256 amount
    ) public virtual override returns (bool) {
        if (getIndex(to) == -1) {
            tokenholders.push(to);
        }
        updateInterest(msg.sender, block.timestamp);
        addInterestToBalance(msg.sender);
        updateInterest(to, block.timestamp);
        addInterestToBalance(to);
        super.transfer(to, amount);
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public virtual override returns (bool) {
        if (getIndex(to) == -1) {
            tokenholders.push(to);
        }
        updateInterest(from, block.timestamp);
        addInterestToBalance(from);
        updateInterest(to, block.timestamp);
        addInterestToBalance(to);
        super.transferFrom(from, to, amount);
        return true;
    }

    function addInterestToBalance(address _tokenholder) public payable {
        updateInterest(_tokenholder, block.timestamp);
        uint accruedInterest = interest[_tokenholder] / 10 ** 9;
        _mint(_tokenholder, accruedInterest);
        interest[_tokenholder] = 0;
        lastTimestamp[_tokenholder] = block.timestamp;
    }
}
