pragma solidity 0.8.4;

import "hardhat/console.sol";
import "./ExampleExternalContract.sol";

contract Staker {
    ExampleExternalContract public exampleExternalContract;

    uint256 public constant threshold = 1 ether;
    uint256 public deadline;
    mapping(address => uint256) public balances;
    bool public openForWithdraw = false;

    event Stake(address indexed staker, uint256 indexed amountAdded);

    constructor(address exampleExternalContractAddress) public {
        exampleExternalContract = ExampleExternalContract(
            exampleExternalContractAddress
        );
        deadline = block.timestamp + 2 days;
    }

    modifier notCompleted() {
        require(!exampleExternalContract.completed(), "Completed already");
        _;
    }

    function _deadlineReached() private view returns (bool) {
        return block.timestamp >= deadline;
    }

    function _hasReachedThreshold() private view returns (bool) {
        return address(this).balance >= threshold;
    }

    /**
     * We better not allow staking after the deadline.
     * Neither after the thing is completed.
     *
     * If we do allow staking under any of those conditions:
     * - it helps no one
     * - there will be unnecessary gas costs for staking and withdrawing
     * - we have to also prevent execute() in case the threshold is reached
     */
    function stake() public payable notCompleted {
        require(
            !_deadlineReached(),
            "deadline reached, no more staking accepted"
        );
        balances[msg.sender] += msg.value;
        emit Stake(msg.sender, msg.value);
    }

    function execute() public notCompleted {
        require(_deadlineReached(), "not over yet");
        if (address(this).balance >= threshold) {
            exampleExternalContract.complete{value: address(this).balance}();
        } else {
            openForWithdraw = true;
        }
    }

    /**
     * This gets executed successfully only if
     * 1. no funds were sent to ExampleExternalContract.
     * 2. the deadline has passed.
     *
     * So it should be fine to keep it public.
     *
     * BUT
     * Allowing anyone to withdraw for anyone else is risky.
     *
     * STAKERS may be themselves CONTRACTS. They may execute some code
     * upon receiving funds. Their OWNERS, who control them, who - say -
     * made them stake, may be unaware that the funds can come back at
     * any moment. So an attacker who knows the contract could produce
     * effects that are possibly undesired for the owner, by choosing
     * the right moment to withdraw for that contract.
     */
    function withdraw(address payable staker) public notCompleted {
        require(openForWithdraw, "withdrawals not possible");
        require(
            balances[staker] > 0,
            "this address doesn't have any funds to withdraw"
        );
        uint256 amount = balances[staker];
        balances[staker] = 0;
        (bool success, bytes memory data) = staker.call{value: amount}("");
        require(success, "could not make payment");
    }

    function timeLeft() public view returns (uint256) {
        return _deadlineReached() ? 0 : deadline - block.timestamp;
    }

    receive() external payable {
        stake();
    }
}
