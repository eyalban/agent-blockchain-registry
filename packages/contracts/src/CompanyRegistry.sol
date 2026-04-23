// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IIdentityRegistry} from "./interfaces/IIdentityRegistry.sol";

/**
 * @title CompanyRegistry
 * @author Statemate Team
 * @notice On-chain primitive for agentic companies: a group of ERC-8004
 *         agents and one or more treasury addresses, owned by a single EOA
 *         (or contract) that can transfer ownership. Intended as the
 *         canonical source of truth for company membership so that other
 *         protocols (ours included) can consolidate financials without
 *         trusting any off-chain API.
 * @dev Deliberately minimal (no ERC-721 implementation) to reduce audit
 *      surface. Companies are referenced by an incrementing uint256 id and
 *      are transferable via `transferCompanyOwnership`. If ERC-721
 *      compatibility is needed later (for wallet display / marketplace
 *      integration), a wrapper can be added without changing core storage.
 */
contract CompanyRegistry {
    // =========================================================================
    // Errors
    // =========================================================================

    error NotCompanyOwner(uint256 companyId, address caller);
    error NotAgentOwner(uint256 agentId, address caller);
    error AgentNotApproved(uint256 companyId, uint256 agentId);
    error CompanyNotFound(uint256 companyId);
    error AgentAlreadyMember(uint256 companyId, uint256 agentId);
    error AgentNotMember(uint256 companyId, uint256 agentId);
    error AgentAlreadyApproved(uint256 companyId, uint256 agentId);
    error AgentNotApprovedYet(uint256 companyId, uint256 agentId);
    error TreasuryAlreadyAdded(uint256 companyId, address treasury);
    error TreasuryNotFound(uint256 companyId, address treasury);
    error ZeroAddress();
    error EmptyMetadataURI();

    // =========================================================================
    // Events
    // =========================================================================

    event CompanyCreated(
        uint256 indexed companyId, address indexed founder, string metadataURI
    );
    event CompanyMetadataUpdated(uint256 indexed companyId, string metadataURI);
    event CompanyOwnershipTransferred(
        uint256 indexed companyId, address indexed previousOwner, address indexed newOwner
    );
    event AgentAdded(uint256 indexed companyId, uint256 indexed agentId);
    event AgentRemoved(uint256 indexed companyId, uint256 indexed agentId);
    /// @notice Emitted when an agent's owner pre-approves a company so that
    ///         the company owner can call `addAgent` even though the company
    ///         owner does not own the agent's NFT. Lets every agent in a
    ///         company keep its own wallet.
    event AgentApprovedCompanyMembership(
        uint256 indexed companyId, uint256 indexed agentId, address indexed agentOwner
    );
    event AgentRevokedCompanyMembership(
        uint256 indexed companyId, uint256 indexed agentId, address indexed agentOwner
    );
    event TreasuryAdded(uint256 indexed companyId, address indexed treasury);
    event TreasuryRemoved(uint256 indexed companyId, address indexed treasury);

    // =========================================================================
    // State
    // =========================================================================

    /// @notice Canonical ERC-8004 Identity Registry, used to cross-check
    ///         that an agent being added to a company is owned by the
    ///         company's owner.
    IIdentityRegistry public immutable identityRegistry;

    /// @notice Next company id to assign (starts at 1 so that 0 can mean
    ///         "no company" in consumers).
    uint256 public nextCompanyId = 1;

    /// @notice companyId -> current owner (EOA or contract).
    mapping(uint256 companyId => address owner) public companyOwner;

    /// @notice companyId -> off-chain metadata URI (IPFS JSON).
    mapping(uint256 companyId => string uri) public companyMetadataURI;

    /// @notice companyId -> agentId -> membership bit.
    mapping(uint256 companyId => mapping(uint256 agentId => bool)) public hasMember;

    /// @notice agentId -> companyId -> "agent owner has authorised this
    ///         company to add the agent as a member." Set by
    ///         `approveCompanyMembership`, cleared by
    ///         `revokeCompanyMembership` or automatically when the agent is
    ///         added (one-shot consumption).
    mapping(uint256 agentId => mapping(uint256 companyId => bool)) public agentApprovedCompany;

    /// @notice companyId -> address -> treasury bit.
    mapping(uint256 companyId => mapping(address treasury => bool)) public hasTreasury;

    /// @notice Enumerable member list per company.
    mapping(uint256 companyId => uint256[]) private _members;

    /// @notice Enumerable treasury list per company.
    mapping(uint256 companyId => address[]) private _treasuries;

    // =========================================================================
    // Modifiers
    // =========================================================================

    modifier onlyCompanyOwner(uint256 companyId) {
        if (companyOwner[companyId] == address(0)) revert CompanyNotFound(companyId);
        if (companyOwner[companyId] != msg.sender) {
            revert NotCompanyOwner(companyId, msg.sender);
        }
        _;
    }

    // =========================================================================
    // Constructor
    // =========================================================================

    /// @param _identityRegistry Canonical ERC-8004 Identity Registry address.
    constructor(address _identityRegistry) {
        if (_identityRegistry == address(0)) revert ZeroAddress();
        identityRegistry = IIdentityRegistry(_identityRegistry);
    }

    // =========================================================================
    // Company Lifecycle
    // =========================================================================

    /**
     * @notice Create a new company. Caller becomes the initial owner.
     * @param metadataURI IPFS or https URI pointing to a JSON describing the
     *        company (name, description, logoURL, jurisdictionCode, …).
     * @return companyId The freshly minted company id.
     */
    function createCompany(string calldata metadataURI) external returns (uint256 companyId) {
        if (bytes(metadataURI).length == 0) revert EmptyMetadataURI();
        companyId = nextCompanyId++;
        companyOwner[companyId] = msg.sender;
        companyMetadataURI[companyId] = metadataURI;
        emit CompanyCreated(companyId, msg.sender, metadataURI);
    }

    /**
     * @notice Update the off-chain metadata URI.
     */
    function updateCompanyMetadata(
        uint256 companyId,
        string calldata metadataURI
    )
        external
        onlyCompanyOwner(companyId)
    {
        if (bytes(metadataURI).length == 0) revert EmptyMetadataURI();
        companyMetadataURI[companyId] = metadataURI;
        emit CompanyMetadataUpdated(companyId, metadataURI);
    }

    /**
     * @notice Transfer company ownership to a new address.
     */
    function transferCompanyOwnership(
        uint256 companyId,
        address newOwner
    )
        external
        onlyCompanyOwner(companyId)
    {
        if (newOwner == address(0)) revert ZeroAddress();
        address previous = companyOwner[companyId];
        companyOwner[companyId] = newOwner;
        emit CompanyOwnershipTransferred(companyId, previous, newOwner);
    }

    // =========================================================================
    // Members
    // =========================================================================

    /**
     * @notice Add an ERC-8004 agent to a company. Two paths are accepted:
     *           1. The company owner is also the agent's NFT owner — i.e.
     *              they hold the agent under their own EOA. This is the
     *              original founder-and-agent-share-a-key path.
     *           2. The agent is owned by a different EOA (so the agent has
     *              its own wallet) AND that EOA has called
     *              `approveCompanyMembership(agentId, companyId)` first. The
     *              approval is consumed when the agent is added.
     *         The caller must always be the company owner — only the company
     *         can decide who is in it. Path 2 lets every agent inside a
     *         company keep an independent wallet, which is the recommended
     *         pattern for agentic companies.
     */
    function addAgent(
        uint256 companyId,
        uint256 agentId
    )
        external
        onlyCompanyOwner(companyId)
    {
        if (hasMember[companyId][agentId]) {
            revert AgentAlreadyMember(companyId, agentId);
        }
        address agentOwner = identityRegistry.ownerOf(agentId);
        if (agentOwner != msg.sender) {
            // Path 2: cross-EOA. The agent's owner must have pre-approved.
            if (!agentApprovedCompany[agentId][companyId]) {
                revert AgentNotApproved(companyId, agentId);
            }
            // One-shot: clear approval so it can't be reused if the agent is
            // later removed and the company tries to silently re-add it.
            agentApprovedCompany[agentId][companyId] = false;
        }
        hasMember[companyId][agentId] = true;
        _members[companyId].push(agentId);
        emit AgentAdded(companyId, agentId);
    }

    /**
     * @notice Pre-approve a company to add this agent as a member. Caller
     *         must be the agent's NFT owner per the canonical Identity
     *         Registry. The approval is consumed by `addAgent`.
     * @dev Lets an autonomously-onboarded agent keep its own wallet while
     *      still being included in a company owned by a separate EOA.
     */
    function approveCompanyMembership(uint256 agentId, uint256 companyId) external {
        if (companyOwner[companyId] == address(0)) revert CompanyNotFound(companyId);
        if (identityRegistry.ownerOf(agentId) != msg.sender) {
            revert NotAgentOwner(agentId, msg.sender);
        }
        if (agentApprovedCompany[agentId][companyId]) {
            revert AgentAlreadyApproved(companyId, agentId);
        }
        agentApprovedCompany[agentId][companyId] = true;
        emit AgentApprovedCompanyMembership(companyId, agentId, msg.sender);
    }

    /**
     * @notice Withdraw a previously-granted approval. Caller must be the
     *         agent's NFT owner. Has no effect on existing membership — to
     *         leave a company the company owner must call `removeAgent`.
     */
    function revokeCompanyMembership(uint256 agentId, uint256 companyId) external {
        if (identityRegistry.ownerOf(agentId) != msg.sender) {
            revert NotAgentOwner(agentId, msg.sender);
        }
        if (!agentApprovedCompany[agentId][companyId]) {
            revert AgentNotApprovedYet(companyId, agentId);
        }
        agentApprovedCompany[agentId][companyId] = false;
        emit AgentRevokedCompanyMembership(companyId, agentId, msg.sender);
    }

    /**
     * @notice Remove an agent from a company. Only the company owner can
     *         call. The agent's canonical registry ownership is unaffected.
     */
    function removeAgent(
        uint256 companyId,
        uint256 agentId
    )
        external
        onlyCompanyOwner(companyId)
    {
        if (!hasMember[companyId][agentId]) revert AgentNotMember(companyId, agentId);
        hasMember[companyId][agentId] = false;

        // O(n) swap-and-pop. Member lists are expected to stay small (dozens
        // at most per company); if this changes, move to a different layout.
        uint256[] storage list = _members[companyId];
        uint256 len = list.length;
        for (uint256 i = 0; i < len; i++) {
            if (list[i] == agentId) {
                list[i] = list[len - 1];
                list.pop();
                break;
            }
        }
        emit AgentRemoved(companyId, agentId);
    }

    // =========================================================================
    // Treasuries
    // =========================================================================

    /**
     * @notice Register a treasury address for a company. A treasury is any
     *         address whose balances and transactions should be consolidated
     *         into the company's financial statements.
     */
    function addTreasury(
        uint256 companyId,
        address treasury
    )
        external
        onlyCompanyOwner(companyId)
    {
        if (treasury == address(0)) revert ZeroAddress();
        if (hasTreasury[companyId][treasury]) {
            revert TreasuryAlreadyAdded(companyId, treasury);
        }
        hasTreasury[companyId][treasury] = true;
        _treasuries[companyId].push(treasury);
        emit TreasuryAdded(companyId, treasury);
    }

    /**
     * @notice Unregister a treasury address from a company.
     */
    function removeTreasury(
        uint256 companyId,
        address treasury
    )
        external
        onlyCompanyOwner(companyId)
    {
        if (!hasTreasury[companyId][treasury]) {
            revert TreasuryNotFound(companyId, treasury);
        }
        hasTreasury[companyId][treasury] = false;

        address[] storage list = _treasuries[companyId];
        uint256 len = list.length;
        for (uint256 i = 0; i < len; i++) {
            if (list[i] == treasury) {
                list[i] = list[len - 1];
                list.pop();
                break;
            }
        }
        emit TreasuryRemoved(companyId, treasury);
    }

    // =========================================================================
    // View helpers
    // =========================================================================

    function members(uint256 companyId) external view returns (uint256[] memory) {
        return _members[companyId];
    }

    function treasuries(uint256 companyId) external view returns (address[] memory) {
        return _treasuries[companyId];
    }

    function memberCount(uint256 companyId) external view returns (uint256) {
        return _members[companyId].length;
    }

    function treasuryCount(uint256 companyId) external view returns (uint256) {
        return _treasuries[companyId].length;
    }
}
