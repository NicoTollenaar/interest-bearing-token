//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

import "./ERC20PublicBalances.sol";
import "./ERC20Burnable.sol";
import "../lib/DSMath.sol";

contract EURDC is ERC20PublicBalances, ERC20Burnable, DSMath {
    uint public rateInRay;
    mapping(address => uint) public interest;
    mapping(address => uint) public lastTimestamp;
    address[] public tokenholders;

    constructor(uint _rateInRay)
        ERC20PublicBalances("EURO Deposit Coin", "EURDC")
    {
        rateInRay = _rateInRay;
    }

    function decimals() public pure override returns (uint8) {
        return 18;
    }

    function getRateInRay() public view returns (uint) {
        return rateInRay;
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

    function updateInterest(address depositor, uint currentTimestamp)
        public
        returns (uint)
    {
        uint timeLapsed;
        if (lastTimestamp[depositor] == 0) {
            lastTimestamp[depositor] = block.timestamp;
        }
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
        return interest[depositor];
    }

    function getInterest(address depositor) public view returns (uint) {
        return interest[depositor];
    }

    function getLastTimestamp(address depositor) public view returns (uint) {
        return lastTimestamp[depositor];
    }

    function getIndex(address tokenholder)
        internal
        view
        returns (int256 index)
    {
        for (uint i = 0; i < tokenholders.length; i++) {
            if (tokenholders[i] == tokenholder) {
                return int(i);
            }
        }
        return -1;
    }

    function transfer(address to, uint256 amount)
        public
        virtual
        override
        returns (bool)
    {
        if (getIndex(to) == -1) {
            tokenholders.push(to);
        }
        updateInterest(msg.sender, block.timestamp);
        console.log(
            "balance sender before add intereste:",
            balanceOf(msg.sender)
        );
        console.log("interest sender before transfer:", interest[msg.sender]);
        addInterestToBalance(msg.sender);
        console.log(
            "balance sender after add intereste:",
            balanceOf(msg.sender)
        );
        updateInterest(to, block.timestamp);
        addInterestToBalance(to);
        super.transfer(to, amount);
        console.log("balance sender after transfer:", balanceOf(msg.sender));
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

    function addInterestToBalance(address depositor) public payable {
        updateInterest(depositor, block.timestamp);
        _balances[depositor] += interest[depositor] / 10**9;
        interest[depositor] = 0;
        lastTimestamp[depositor] = block.timestamp;
    }
}
