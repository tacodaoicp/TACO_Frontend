import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface AdminActionLog {
  'id' : bigint,
  'result' : string,
  'action' : string,
  'parameters' : string,
  'timestamp' : bigint,
  'caller' : Principal,
}
export type AdminPermission = { 'Admin' : null };
export interface AlarmAcknowledgment {
  'alarmId' : bigint,
  'acknowledgedAt' : bigint,
  'acknowledgedBy' : Principal,
}
export type AlarmImportanceLevel = { 'Level2DelayedSMS' : null } |
  { 'Level1Immediate' : null };
export interface AlarmLog {
  'id' : bigint,
  'contactsSent' : Array<bigint>,
  'alarmType' : AlarmType,
  'message' : string,
  'timestamp' : bigint,
  'success' : boolean,
}
export type AlarmState = { 'NotSent' : null } |
  { 'Sent' : null } |
  { 'Resolved' : null };
export type AlarmType = {
    'StatusChanged' : { 'to' : RebalanceStatus, 'from' : RebalanceStatus }
  } |
  { 'SystemError' : string } |
  { 'TradingStalled' : null } |
  { 'TradingStarted' : null };
export type CanisterMonitoringStatus = { 'Error' : string } |
  { 'StatusChanged' : string } |
  { 'Healthy' : null } |
  { 'CyclesLow' : bigint } |
  { 'TimerStalled' : string };
export interface Contact {
  'id' : bigint,
  'active' : boolean,
  'contactType' : ContactType,
  'name' : string,
  'addedAt' : bigint,
  'addedBy' : Principal,
}
export type ContactType = { 'SMS' : string } |
  { 'Email' : string };
export interface MonitoredCanisterConfig {
  'id' : bigint,
  'timersAlertLevel' : AlarmImportanceLevel,
  'name' : string,
  'minimumCycles' : bigint,
  'cyclesAlertLevel' : AlarmImportanceLevel,
  'enabled' : boolean,
  'addedAt' : bigint,
  'addedBy' : Principal,
  'statusAlertLevel' : AlarmImportanceLevel,
  'snsRootCanisterId' : [] | [Principal],
  'canisterId' : Principal,
  'isSNSControlled' : boolean,
}
export interface PendingAlarm {
  'id' : bigint,
  'acknowledgedBy' : [] | [Principal],
  'emailSentAt' : [] | [bigint],
  'acknowledged' : boolean,
  'importanceLevel' : AlarmImportanceLevel,
  'message' : string,
  'smsPendingAt' : [] | [bigint],
}
export type RebalanceStatus = { 'Failed' : string } |
  { 'Idle' : null } |
  { 'Trading' : null };
export type Result = { 'ok' : string } |
  { 'err' : string };
export type Result_1 = { 'ok' : bigint } |
  { 'err' : string };
export type Result_10 = {
    'ok' : {
      'canisterMonitoringMinutes' : bigint,
      'level2SMSCheckMinutes' : bigint,
      'level2AlarmDelayMinutes' : bigint,
      'treasuryCheckMinutes' : bigint,
    }
  } |
  { 'err' : string };
export type Result_11 = {
    'ok' : Array<
      [
        MonitoredCanisterConfig,
        CanisterMonitoringStatus,
        CanisterMonitoringStatus,
        CanisterMonitoringStatus,
      ]
    >
  } |
  { 'err' : string };
export type Result_12 = {
    'ok' : {
      'smsUrl' : string,
      'username' : string,
      'apiKey' : string,
      'emailUrl' : string,
    }
  } |
  { 'err' : string };
export type Result_13 = { 'ok' : Array<AlarmLog> } |
  { 'err' : string };
export type Result_14 = { 'ok' : Array<AlarmAcknowledgment> } |
  { 'err' : string };
export type Result_15 = { 'ok' : Array<AdminPermission> } |
  { 'err' : string };
export type Result_16 = { 'ok' : Array<AdminActionLog> } |
  { 'err' : string };
export type Result_2 = { 'ok' : Array<SystemError> } |
  { 'err' : string };
export type Result_3 = { 'ok' : Array<SentMessage> } |
  { 'err' : string };
export type Result_4 = {
    'ok' : {
      'smsQueueSize' : bigint,
      'processingIntervalMinutes' : bigint,
      'emailQueueSize' : bigint,
    }
  } |
  { 'err' : string };
export type Result_5 = { 'ok' : Array<PendingAlarm> } |
  { 'err' : string };
export type Result_6 = {
    'ok' : {
      'activeContacts' : bigint,
      'lastKnownStatus' : [] | [RebalanceStatus],
      'totalContacts' : bigint,
      'enabled' : boolean,
      'tradingStallAlarmState' : AlarmState,
      'checkIntervalMinutes' : bigint,
      'lastTradingStallTime' : bigint,
    }
  } |
  { 'err' : string };
export type Result_7 = { 'ok' : Array<MonitoredCanisterConfig> } |
  { 'err' : string };
export type Result_8 = {
    'ok' : {
      'smsQueueSize' : bigint,
      'monitoredCanistersCount' : bigint,
      'pendingAlarmsCount' : bigint,
      'level2AlarmsPendingSMS' : bigint,
      'emailQueueSize' : bigint,
      'acknowledgmentsCount' : bigint,
      'enabledCanistersCount' : bigint,
    }
  } |
  { 'err' : string };
export type Result_9 = { 'ok' : Array<Contact> } |
  { 'err' : string };
export interface SentMessage {
  'id' : bigint,
  'alarmId' : [] | [bigint],
  'contactInfo' : string,
  'errorMessage' : [] | [string],
  'sentAt' : bigint,
  'messageType' : { 'SMS' : null } |
    { 'Email' : null },
  'message' : string,
  'success' : boolean,
  'contactId' : bigint,
}
export interface SystemError {
  'id' : bigint,
  'resolved' : boolean,
  'errorMessage' : string,
  'errorType' : { 'TimerSetup' : { 'timerType' : string } } |
    { 'InterCanisterCall' : { 'function' : string, 'target' : Principal } } |
    { 'QueueProcessing' : { 'queueType' : string } } |
    { 'MonitoringError' : { 'component' : string } } |
    { 'SystemHealth' : { 'check' : string } },
  'timestamp' : bigint,
  'retryAttempts' : bigint,
}
export interface http_header { 'value' : string, 'name' : string }
export interface http_request_result {
  'status' : bigint,
  'body' : Uint8Array | number[],
  'headers' : Array<http_header>,
}
export interface _SERVICE {
  'acknowledgeAlarm' : ActorMethod<[bigint], Result>,
  'addAdmin' : ActorMethod<[Principal, Array<AdminPermission>], Result>,
  'addContact' : ActorMethod<[string, ContactType], Result_1>,
  'addMonitoredCanister' : ActorMethod<
    [
      Principal,
      string,
      boolean,
      [] | [Principal],
      bigint,
      AlarmImportanceLevel,
      AlarmImportanceLevel,
      AlarmImportanceLevel,
    ],
    Result_1
  >,
  'clearAllLogs' : ActorMethod<[], Result>,
  'clearQueues' : ActorMethod<[], Result>,
  'getAdminActionLogs' : ActorMethod<[[] | [bigint]], Result_16>,
  'getAdminPermissions' : ActorMethod<[], Result_15>,
  'getAlarmAcknowledgments' : ActorMethod<[[] | [bigint]], Result_14>,
  'getAlarmLogs' : ActorMethod<[[] | [bigint]], Result_13>,
  'getApiConfiguration' : ActorMethod<[], Result_12>,
  'getCanisterHealthStatus' : ActorMethod<[], Result_11>,
  'getConfigurationIntervals' : ActorMethod<[], Result_10>,
  'getContacts' : ActorMethod<[], Result_9>,
  'getEnhancedAlarmSystemStatus' : ActorMethod<[], Result_8>,
  'getMonitoredCanisters' : ActorMethod<[], Result_7>,
  'getMonitoringStatus' : ActorMethod<[], Result_6>,
  'getPendingAlarms' : ActorMethod<[], Result_5>,
  'getQueueStatus' : ActorMethod<[], Result_4>,
  'getSentEmailMessages' : ActorMethod<[[] | [bigint]], Result_3>,
  'getSentMessages' : ActorMethod<[[] | [bigint]], Result_3>,
  'getSentSMSMessages' : ActorMethod<[[] | [bigint]], Result_3>,
  'getSystemErrors' : ActorMethod<[[] | [bigint]], Result_2>,
  'manualRestartTimer' : ActorMethod<[], Result>,
  'performSystemHealthCheckManual' : ActorMethod<[], Result>,
  'removeAdmin' : ActorMethod<[Principal], Result>,
  'removeContact' : ActorMethod<[bigint], Result_1>,
  'removeMonitoredCanister' : ActorMethod<[bigint], Result>,
  'resetAlarmStates' : ActorMethod<[], Result>,
  'resolveSystemErrorById' : ActorMethod<[bigint], Result>,
  'sendTestEmail' : ActorMethod<[Array<bigint>], Result>,
  'sendTestEmailSingle' : ActorMethod<[string, string], Result>,
  'sendTestSMS' : ActorMethod<[Array<bigint>], Result>,
  'sendTestSMSSingle' : ActorMethod<[string], Result>,
  'setCanisterMonitoringInterval' : ActorMethod<[bigint], Result>,
  'setCheckInterval' : ActorMethod<[bigint], Result>,
  'setLevel2SMSCheckInterval' : ActorMethod<[bigint], Result>,
  'startCanisterMonitoring' : ActorMethod<[], Result>,
  'startMonitoring' : ActorMethod<[], Result>,
  'stopCanisterMonitoring' : ActorMethod<[], Result>,
  'stopMonitoring' : ActorMethod<[], Result>,
  'transform' : ActorMethod<
    [{ 'context' : Uint8Array | number[], 'response' : http_request_result }],
    http_request_result
  >,
  'updateCanisterAlertLevels' : ActorMethod<
    [
      bigint,
      [] | [AlarmImportanceLevel],
      [] | [AlarmImportanceLevel],
      [] | [AlarmImportanceLevel],
    ],
    Result
  >,
  'updateClickSendApiKey' : ActorMethod<[string], Result>,
  'updateClickSendEmailID' : ActorMethod<[string], Result>,
  'updateClickSendEmailUrl' : ActorMethod<[string], Result>,
  'updateClickSendSmsUrl' : ActorMethod<[string], Result>,
  'updateClickSendUsername' : ActorMethod<[string], Result>,
  'updateContactStatus' : ActorMethod<[bigint, boolean], Result>,
  'updateMonitoredCanisterStatus' : ActorMethod<[bigint, boolean], Result>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];