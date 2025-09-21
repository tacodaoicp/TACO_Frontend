export const idlFactory = ({ IDL }) => {
  const Result = IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text });
  const AdminPermission = IDL.Variant({ 'Admin' : IDL.Null });
  const ContactType = IDL.Variant({ 'SMS' : IDL.Text, 'Email' : IDL.Text });
  const Result_1 = IDL.Variant({ 'ok' : IDL.Nat, 'err' : IDL.Text });
  const AlarmImportanceLevel = IDL.Variant({
    'Level2DelayedSMS' : IDL.Null,
    'Level1Immediate' : IDL.Null,
  });
  const AdminActionLog = IDL.Record({
    'id' : IDL.Nat,
    'result' : IDL.Text,
    'action' : IDL.Text,
    'parameters' : IDL.Text,
    'timestamp' : IDL.Int,
    'caller' : IDL.Principal,
  });
  const Result_17 = IDL.Variant({
    'ok' : IDL.Vec(AdminActionLog),
    'err' : IDL.Text,
  });
  const Result_16 = IDL.Variant({
    'ok' : IDL.Vec(AdminPermission),
    'err' : IDL.Text,
  });
  const AlarmAcknowledgment = IDL.Record({
    'alarmId' : IDL.Nat,
    'acknowledgedAt' : IDL.Int,
    'acknowledgedBy' : IDL.Principal,
  });
  const Result_15 = IDL.Variant({
    'ok' : IDL.Vec(AlarmAcknowledgment),
    'err' : IDL.Text,
  });
  const RebalanceStatus = IDL.Variant({
    'Failed' : IDL.Text,
    'Idle' : IDL.Null,
    'Trading' : IDL.Null,
  });
  const AlarmType = IDL.Variant({
    'StatusChanged' : IDL.Record({
      'to' : RebalanceStatus,
      'from' : RebalanceStatus,
    }),
    'SystemError' : IDL.Text,
    'TradingStalled' : IDL.Null,
    'TradingStarted' : IDL.Null,
  });
  const AlarmLog = IDL.Record({
    'id' : IDL.Nat,
    'contactsSent' : IDL.Vec(IDL.Nat),
    'alarmType' : AlarmType,
    'message' : IDL.Text,
    'timestamp' : IDL.Int,
    'success' : IDL.Bool,
  });
  const Result_14 = IDL.Variant({ 'ok' : IDL.Vec(AlarmLog), 'err' : IDL.Text });
  const Result_13 = IDL.Variant({
    'ok' : IDL.Record({
      'smsUrl' : IDL.Text,
      'username' : IDL.Text,
      'apiKey' : IDL.Text,
      'emailUrl' : IDL.Text,
    }),
    'err' : IDL.Text,
  });
  const MonitoredCanisterConfig = IDL.Record({
    'id' : IDL.Nat,
    'timersAlertLevel' : AlarmImportanceLevel,
    'name' : IDL.Text,
    'minimumCycles' : IDL.Nat,
    'cyclesAlertLevel' : AlarmImportanceLevel,
    'enabled' : IDL.Bool,
    'addedAt' : IDL.Int,
    'addedBy' : IDL.Principal,
    'statusAlertLevel' : AlarmImportanceLevel,
    'snsRootCanisterId' : IDL.Opt(IDL.Principal),
    'canisterId' : IDL.Principal,
    'isSNSControlled' : IDL.Bool,
  });
  const CanisterMonitoringStatus = IDL.Variant({
    'Error' : IDL.Text,
    'StatusChanged' : IDL.Text,
    'Healthy' : IDL.Null,
    'CyclesLow' : IDL.Nat,
    'TimerStalled' : IDL.Text,
  });
  const Result_12 = IDL.Variant({
    'ok' : IDL.Vec(
      IDL.Tuple(
        MonitoredCanisterConfig,
        CanisterMonitoringStatus,
        CanisterMonitoringStatus,
        CanisterMonitoringStatus,
      )
    ),
    'err' : IDL.Text,
  });
  const Result_11 = IDL.Variant({
    'ok' : IDL.Record({
      'canisterMonitoringMinutes' : IDL.Nat,
      'level2SMSCheckMinutes' : IDL.Nat,
      'level2AlarmDelayMinutes' : IDL.Nat,
      'treasuryCheckMinutes' : IDL.Nat,
    }),
    'err' : IDL.Text,
  });
  const Contact = IDL.Record({
    'id' : IDL.Nat,
    'active' : IDL.Bool,
    'contactType' : ContactType,
    'name' : IDL.Text,
    'addedAt' : IDL.Int,
    'addedBy' : IDL.Principal,
  });
  const Result_10 = IDL.Variant({ 'ok' : IDL.Vec(Contact), 'err' : IDL.Text });
  const Result_9 = IDL.Variant({
    'ok' : IDL.Record({
      'smsQueueSize' : IDL.Nat,
      'monitoredCanistersCount' : IDL.Nat,
      'pendingAlarmsCount' : IDL.Nat,
      'level2AlarmsPendingSMS' : IDL.Nat,
      'emailQueueSize' : IDL.Nat,
      'acknowledgmentsCount' : IDL.Nat,
      'enabledCanistersCount' : IDL.Nat,
    }),
    'err' : IDL.Text,
  });
  const InternalError = IDL.Record({
    'id' : IDL.Nat,
    'context' : IDL.Opt(IDL.Text),
    'errorType' : IDL.Text,
    'message' : IDL.Text,
    'timestamp' : IDL.Int,
  });
  const Result_8 = IDL.Variant({
    'ok' : IDL.Vec(InternalError),
    'err' : IDL.Text,
  });
  const Result_7 = IDL.Variant({
    'ok' : IDL.Vec(MonitoredCanisterConfig),
    'err' : IDL.Text,
  });
  const AlarmState = IDL.Variant({
    'NotSent' : IDL.Null,
    'Sent' : IDL.Null,
    'Resolved' : IDL.Null,
  });
  const Result_6 = IDL.Variant({
    'ok' : IDL.Record({
      'activeContacts' : IDL.Nat,
      'lastKnownStatus' : IDL.Opt(RebalanceStatus),
      'totalContacts' : IDL.Nat,
      'enabled' : IDL.Bool,
      'tradingStallAlarmState' : AlarmState,
      'checkIntervalMinutes' : IDL.Nat,
      'lastTradingStallTime' : IDL.Int,
    }),
    'err' : IDL.Text,
  });
  const PendingAlarm = IDL.Record({
    'id' : IDL.Nat,
    'acknowledgedBy' : IDL.Opt(IDL.Principal),
    'emailSentAt' : IDL.Opt(IDL.Int),
    'acknowledged' : IDL.Bool,
    'importanceLevel' : AlarmImportanceLevel,
    'message' : IDL.Text,
    'smsPendingAt' : IDL.Opt(IDL.Int),
  });
  const Result_5 = IDL.Variant({
    'ok' : IDL.Vec(PendingAlarm),
    'err' : IDL.Text,
  });
  const Result_4 = IDL.Variant({
    'ok' : IDL.Record({
      'smsQueueSize' : IDL.Nat,
      'processingIntervalMinutes' : IDL.Nat,
      'emailQueueSize' : IDL.Nat,
    }),
    'err' : IDL.Text,
  });
  const SentMessage = IDL.Record({
    'id' : IDL.Nat,
    'alarmId' : IDL.Opt(IDL.Nat),
    'contactInfo' : IDL.Text,
    'errorMessage' : IDL.Opt(IDL.Text),
    'sentAt' : IDL.Int,
    'messageType' : IDL.Variant({ 'SMS' : IDL.Null, 'Email' : IDL.Null }),
    'message' : IDL.Text,
    'success' : IDL.Bool,
    'contactId' : IDL.Nat,
  });
  const Result_3 = IDL.Variant({
    'ok' : IDL.Vec(SentMessage),
    'err' : IDL.Text,
  });
  const SystemError = IDL.Record({
    'id' : IDL.Nat,
    'resolved' : IDL.Bool,
    'errorMessage' : IDL.Text,
    'errorType' : IDL.Variant({
      'TimerSetup' : IDL.Record({ 'timerType' : IDL.Text }),
      'InterCanisterCall' : IDL.Record({
        'function' : IDL.Text,
        'target' : IDL.Principal,
      }),
      'QueueProcessing' : IDL.Record({ 'queueType' : IDL.Text }),
      'MonitoringError' : IDL.Record({ 'component' : IDL.Text }),
      'SystemHealth' : IDL.Record({ 'check' : IDL.Text }),
    }),
    'timestamp' : IDL.Int,
    'retryAttempts' : IDL.Nat,
  });
  const Result_2 = IDL.Variant({
    'ok' : IDL.Vec(SystemError),
    'err' : IDL.Text,
  });
  const http_header = IDL.Record({ 'value' : IDL.Text, 'name' : IDL.Text });
  const http_request_result = IDL.Record({
    'status' : IDL.Nat,
    'body' : IDL.Vec(IDL.Nat8),
    'headers' : IDL.Vec(http_header),
  });
  return IDL.Service({
    'acknowledgeAlarm' : IDL.Func([IDL.Nat], [Result], []),
    'addAdmin' : IDL.Func(
        [IDL.Principal, IDL.Vec(AdminPermission)],
        [Result],
        [],
      ),
    'addContact' : IDL.Func([IDL.Text, ContactType], [Result_1], []),
    'addMonitoredCanister' : IDL.Func(
        [
          IDL.Principal,
          IDL.Text,
          IDL.Bool,
          IDL.Opt(IDL.Principal),
          IDL.Nat,
          AlarmImportanceLevel,
          AlarmImportanceLevel,
          AlarmImportanceLevel,
        ],
        [Result_1],
        [],
      ),
    'clearAllLogs' : IDL.Func([], [Result], []),
    'clearQueues' : IDL.Func([], [Result], []),
    'getAdminActionLogs' : IDL.Func([IDL.Opt(IDL.Nat)], [Result_17], ['query']),
    'getAdminPermissions' : IDL.Func([], [Result_16], ['query']),
    'getAlarmAcknowledgments' : IDL.Func(
        [IDL.Opt(IDL.Nat)],
        [Result_15],
        ['query'],
      ),
    'getAlarmLogs' : IDL.Func([IDL.Opt(IDL.Nat)], [Result_14], ['query']),
    'getApiConfiguration' : IDL.Func([], [Result_13], ['query']),
    'getCanisterHealthStatus' : IDL.Func([], [Result_12], []),
    'getConfigurationIntervals' : IDL.Func([], [Result_11], ['query']),
    'getContacts' : IDL.Func([], [Result_10], ['query']),
    'getEnhancedAlarmSystemStatus' : IDL.Func([], [Result_9], ['query']),
    'getInternalErrors' : IDL.Func([IDL.Opt(IDL.Nat)], [Result_8], ['query']),
    'getMonitoredCanisters' : IDL.Func([], [Result_7], ['query']),
    'getMonitoringStatus' : IDL.Func([], [Result_6], ['query']),
    'getPendingAlarms' : IDL.Func([], [Result_5], ['query']),
    'getQueueStatus' : IDL.Func([], [Result_4], []),
    'getSentEmailMessages' : IDL.Func(
        [IDL.Opt(IDL.Nat)],
        [Result_3],
        ['query'],
      ),
    'getSentMessages' : IDL.Func([IDL.Opt(IDL.Nat)], [Result_3], ['query']),
    'getSentSMSMessages' : IDL.Func([IDL.Opt(IDL.Nat)], [Result_3], ['query']),
    'getSystemErrors' : IDL.Func([IDL.Opt(IDL.Nat)], [Result_2], ['query']),
    'manualRestartTimer' : IDL.Func([], [Result], []),
    'performSystemHealthCheckManual' : IDL.Func([], [Result], []),
    'removeAdmin' : IDL.Func([IDL.Principal], [Result], []),
    'removeContact' : IDL.Func([IDL.Nat], [Result_1], []),
    'removeMonitoredCanister' : IDL.Func([IDL.Nat], [Result], []),
    'resetAlarmStates' : IDL.Func([], [Result], []),
    'resolveSystemErrorById' : IDL.Func([IDL.Nat], [Result], []),
    'sendTestEmail' : IDL.Func([IDL.Vec(IDL.Nat)], [Result], []),
    'sendTestEmailSingle' : IDL.Func([IDL.Text, IDL.Text], [Result], []),
    'sendTestSMS' : IDL.Func([IDL.Vec(IDL.Nat)], [Result], []),
    'sendTestSMSSingle' : IDL.Func([IDL.Text], [Result], []),
    'setCanisterMonitoringInterval' : IDL.Func([IDL.Nat], [Result], []),
    'setCheckInterval' : IDL.Func([IDL.Nat], [Result], []),
    'setLevel2SMSCheckInterval' : IDL.Func([IDL.Nat], [Result], []),
    'startCanisterMonitoring' : IDL.Func([], [Result], []),
    'startMonitoring' : IDL.Func([], [Result], []),
    'stopCanisterMonitoring' : IDL.Func([], [Result], []),
    'stopMonitoring' : IDL.Func([], [Result], []),
    'transform' : IDL.Func(
        [
          IDL.Record({
            'context' : IDL.Vec(IDL.Nat8),
            'response' : http_request_result,
          }),
        ],
        [http_request_result],
        ['query'],
      ),
    'updateCanisterAlertLevels' : IDL.Func(
        [
          IDL.Nat,
          IDL.Opt(AlarmImportanceLevel),
          IDL.Opt(AlarmImportanceLevel),
          IDL.Opt(AlarmImportanceLevel),
        ],
        [Result],
        [],
      ),
    'updateClickSendApiKey' : IDL.Func([IDL.Text], [Result], []),
    'updateClickSendEmailID' : IDL.Func([IDL.Text], [Result], []),
    'updateClickSendEmailUrl' : IDL.Func([IDL.Text], [Result], []),
    'updateClickSendSmsUrl' : IDL.Func([IDL.Text], [Result], []),
    'updateClickSendUsername' : IDL.Func([IDL.Text], [Result], []),
    'updateContactStatus' : IDL.Func([IDL.Nat, IDL.Bool], [Result], []),
    'updateMonitoredCanisterStatus' : IDL.Func(
        [IDL.Nat, IDL.Bool],
        [Result],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
