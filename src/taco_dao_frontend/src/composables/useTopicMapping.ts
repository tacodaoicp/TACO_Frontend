export interface TopicInfo {
  id: string
  name: string
  description: string
  icon: string
  color: string
  isCritical: boolean
}

export const useTopicMapping = () => {
  // Topic mapping based on IDL Variant order
  const topicMap = new Map<string, TopicInfo>([
    ['DappCanisterManagement', {
      id: 'DappCanisterManagement',
      name: 'Dapp Canister Management',
      description: 'Proposals for managing dapp canisters and their settings',
      icon: 'fa-cube',
      color: '#fd7e14',
      isCritical: false
    }],
    ['DaoCommunitySettings', {
      id: 'DaoCommunitySettings',
      name: 'DAO Community Settings',
      description: 'Proposals related to community governance settings and parameters',
      icon: 'fa-users',
      color: '#17a2b8',
      isCritical: false
    }],
    ['ApplicationBusinessLogic', {
      id: 'ApplicationBusinessLogic',
      name: 'Application Business Logic',
      description: 'Proposals related to core application functionality and business rules',
      icon: 'fa-brain',
      color: '#28a745',
      isCritical: false
    }],
    ['CriticalDappOperations', {
      id: 'CriticalDappOperations',
      name: 'Critical Dapp Operations',
      description: 'Critical proposals affecting core dapp operations and security',
      icon: 'fa-exclamation-triangle',
      color: '#e83e8c',
      isCritical: true
    }],
    ['TreasuryAssetManagement', {
      id: 'TreasuryAssetManagement',
      name: 'Treasury Asset Management',
      description: 'Proposals for managing treasury funds and asset allocation',
      icon: 'fa-coins',
      color: '#ffc107',
      isCritical: true
    }],
    ['Governance', {
      id: 'Governance',
      name: 'Governance',
      description: 'Core governance proposals affecting voting and decision-making processes',
      icon: 'fa-gavel',
      color: '#dc3545',
      isCritical: true
    }],
    ['SnsFrameworkManagement', {
      id: 'SnsFrameworkManagement',
      name: 'SNS Framework Management',
      description: 'Proposals for managing the SNS framework and core functionality',
      icon: 'fa-cogs',
      color: '#6f42c1',
      isCritical: true
    }]
  ])

  const getAllTopics = (): TopicInfo[] => {
    return Array.from(topicMap.values())
  }

  const getTopicInfo = (topicId: string): TopicInfo | undefined => {
    return topicMap.get(topicId)
  }

  const getCriticalTopics = (): TopicInfo[] => {
    return Array.from(topicMap.values()).filter(topic => topic.isCritical)
  }

  const getNonCriticalTopics = (): TopicInfo[] => {
    return Array.from(topicMap.values()).filter(topic => !topic.isCritical)
  }

  const getTopicIcon = (topicId: string): string => {
    return getTopicInfo(topicId)?.icon || 'fa-question'
  }

  const getTopicColor = (topicId: string): string => {
    return getTopicInfo(topicId)?.color || '#6c757d'
  }

  const getTopicName = (topicId: string): string => {
    return getTopicInfo(topicId)?.name || 'Unknown Topic'
  }

  const getTopicDescription = (topicId: string): string => {
    return getTopicInfo(topicId)?.description || 'Unknown topic description'
  }

  return {
    getAllTopics,
    getTopicInfo,
    getCriticalTopics,
    getNonCriticalTopics,
    getTopicIcon,
    getTopicColor,
    getTopicName,
    getTopicDescription
  }
}
