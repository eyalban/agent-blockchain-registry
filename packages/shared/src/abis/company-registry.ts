/**
 * ABI for the CompanyRegistry contract.
 * Deployed Base Sepolia: 0x7b1598Ee7303A9EF733d2de92Ff81d555dcAb4A8
 *
 * v2: adds the agent-side approval flow
 * (`approveCompanyMembership` / `revokeCompanyMembership`) so every agent
 * inside a company can keep its own wallet. `addAgent` accepts either the
 * legacy single-EOA path or the cross-EOA path with prior approval.
 */
export const companyRegistryAbi = [
  // Constructor
  {
    type: 'constructor',
    inputs: [{ name: '_identityRegistry', type: 'address' }],
    stateMutability: 'nonpayable',
  },

  // Writes
  {
    type: 'function',
    name: 'createCompany',
    inputs: [{ name: 'metadataURI', type: 'string' }],
    outputs: [{ name: 'companyId', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'updateCompanyMetadata',
    inputs: [
      { name: 'companyId', type: 'uint256' },
      { name: 'metadataURI', type: 'string' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'transferCompanyOwnership',
    inputs: [
      { name: 'companyId', type: 'uint256' },
      { name: 'newOwner', type: 'address' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'addAgent',
    inputs: [
      { name: 'companyId', type: 'uint256' },
      { name: 'agentId', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'removeAgent',
    inputs: [
      { name: 'companyId', type: 'uint256' },
      { name: 'agentId', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'approveCompanyMembership',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'companyId', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'revokeCompanyMembership',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'companyId', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'addTreasury',
    inputs: [
      { name: 'companyId', type: 'uint256' },
      { name: 'treasury', type: 'address' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'removeTreasury',
    inputs: [
      { name: 'companyId', type: 'uint256' },
      { name: 'treasury', type: 'address' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },

  // Reads
  {
    type: 'function',
    name: 'nextCompanyId',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'companyOwner',
    inputs: [{ name: 'companyId', type: 'uint256' }],
    outputs: [{ name: 'owner', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'companyMetadataURI',
    inputs: [{ name: 'companyId', type: 'uint256' }],
    outputs: [{ name: 'uri', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'hasMember',
    inputs: [
      { name: 'companyId', type: 'uint256' },
      { name: 'agentId', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'agentApprovedCompany',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'companyId', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'hasTreasury',
    inputs: [
      { name: 'companyId', type: 'uint256' },
      { name: 'treasury', type: 'address' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'members',
    inputs: [{ name: 'companyId', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'treasuries',
    inputs: [{ name: 'companyId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'memberCount',
    inputs: [{ name: 'companyId', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'treasuryCount',
    inputs: [{ name: 'companyId', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'identityRegistry',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },

  // Events
  {
    type: 'event',
    name: 'CompanyCreated',
    inputs: [
      { name: 'companyId', type: 'uint256', indexed: true },
      { name: 'founder', type: 'address', indexed: true },
      { name: 'metadataURI', type: 'string', indexed: false },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'CompanyMetadataUpdated',
    inputs: [
      { name: 'companyId', type: 'uint256', indexed: true },
      { name: 'metadataURI', type: 'string', indexed: false },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'CompanyOwnershipTransferred',
    inputs: [
      { name: 'companyId', type: 'uint256', indexed: true },
      { name: 'previousOwner', type: 'address', indexed: true },
      { name: 'newOwner', type: 'address', indexed: true },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'AgentAdded',
    inputs: [
      { name: 'companyId', type: 'uint256', indexed: true },
      { name: 'agentId', type: 'uint256', indexed: true },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'AgentRemoved',
    inputs: [
      { name: 'companyId', type: 'uint256', indexed: true },
      { name: 'agentId', type: 'uint256', indexed: true },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'AgentApprovedCompanyMembership',
    inputs: [
      { name: 'companyId', type: 'uint256', indexed: true },
      { name: 'agentId', type: 'uint256', indexed: true },
      { name: 'agentOwner', type: 'address', indexed: true },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'AgentRevokedCompanyMembership',
    inputs: [
      { name: 'companyId', type: 'uint256', indexed: true },
      { name: 'agentId', type: 'uint256', indexed: true },
      { name: 'agentOwner', type: 'address', indexed: true },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'TreasuryAdded',
    inputs: [
      { name: 'companyId', type: 'uint256', indexed: true },
      { name: 'treasury', type: 'address', indexed: true },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'TreasuryRemoved',
    inputs: [
      { name: 'companyId', type: 'uint256', indexed: true },
      { name: 'treasury', type: 'address', indexed: true },
    ],
    anonymous: false,
  },
] as const
