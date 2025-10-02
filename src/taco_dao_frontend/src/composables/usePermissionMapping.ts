import { SnsNeuronPermissionType } from '@dfinity/sns'

export interface PermissionInfo {
  icon: string
  name: string
  description: string
  color: string
}

export const usePermissionMapping = () => {
  const permissionMap = new Map<number, PermissionInfo>([
    [SnsNeuronPermissionType.NEURON_PERMISSION_TYPE_CONFIGURE_DISSOLVE_STATE, {
      icon: 'fa-cog',
      name: 'Configure',
      description: 'Modify neuron dissolve delay and dissolving state',
      color: '#17a2b8'
    }],
    [SnsNeuronPermissionType.NEURON_PERMISSION_TYPE_MANAGE_PRINCIPALS, {
      icon: 'fa-users-cog',
      name: 'Manage Principals',
      description: 'Add/remove principals and manage their permissions (ADMIN)',
      color: '#dc3545'
    }],
    [SnsNeuronPermissionType.NEURON_PERMISSION_TYPE_SUBMIT_PROPOSAL, {
      icon: 'fa-file-plus',
      name: 'Submit Proposal',
      description: 'Submit new governance proposals',
      color: '#6f42c1'
    }],
    [SnsNeuronPermissionType.NEURON_PERMISSION_TYPE_VOTE, {
      icon: 'fa-vote-yea',
      name: 'Vote',
      description: 'Vote on governance proposals',
      color: '#007bff'
    }],
    [SnsNeuronPermissionType.NEURON_PERMISSION_TYPE_DISBURSE, {
      icon: 'fa-money-bill-wave',
      name: 'Disburse',
      description: 'Disburse neuron stake',
      color: '#28a745'
    }],
    [SnsNeuronPermissionType.NEURON_PERMISSION_TYPE_SPLIT, {
      icon: 'fa-cut',
      name: 'Split',
      description: 'Split neuron into multiple neurons',
      color: '#fd7e14'
    }],
    [SnsNeuronPermissionType.NEURON_PERMISSION_TYPE_MERGE_MATURITY, {
      icon: 'fa-compress-arrows-alt',
      name: 'Merge Maturity',
      description: 'Merge maturity into neuron stake',
      color: '#20c997'
    }],
    [SnsNeuronPermissionType.NEURON_PERMISSION_TYPE_DISBURSE_MATURITY, {
      icon: 'fa-coins',
      name: 'Disburse Maturity',
      description: 'Disburse neuron maturity rewards',
      color: '#ffc107'
    }],
    [SnsNeuronPermissionType.NEURON_PERMISSION_TYPE_STAKE_MATURITY, {
      icon: 'fa-arrow-up',
      name: 'Stake Maturity',
      description: 'Stake maturity to increase neuron stake',
      color: '#6610f2'
    }],
    [SnsNeuronPermissionType.NEURON_PERMISSION_TYPE_MANAGE_VOTING_PERMISSION, {
      icon: 'fa-user-check',
      name: 'Manage Voting',
      description: 'Manage voting and following settings',
      color: '#e83e8c'
    }]
  ])

  const getPermissionInfo = (permissionType: number): PermissionInfo => {
    return permissionMap.get(permissionType) || {
      icon: 'fa-question',
      name: 'Unknown',
      description: 'Unknown permission type',
      color: '#6c757d'
    }
  }

  const getPermissionIcon = (permissionType: number): string => {
    return getPermissionInfo(permissionType).icon
  }

  const getPermissionName = (permissionType: number): string => {
    return getPermissionInfo(permissionType).name
  }

  const getPermissionDescription = (permissionType: number): string => {
    return getPermissionInfo(permissionType).description
  }

  const getPermissionColor = (permissionType: number): string => {
    return getPermissionInfo(permissionType).color
  }

  return {
    getPermissionInfo,
    getPermissionIcon,
    getPermissionName,
    getPermissionDescription,
    getPermissionColor
  }
}
