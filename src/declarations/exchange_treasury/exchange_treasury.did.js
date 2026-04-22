export const idlFactory = ({ IDL }) => {
  const Subaccount = IDL.Vec(IDL.Nat8);
  const TransferRecipient = IDL.Variant({
    'principal' : IDL.Principal,
    'accountId' : IDL.Record({
      'owner' : IDL.Principal,
      'subaccount' : IDL.Opt(Subaccount),
    }),
  });
  const treasury = IDL.Service({
    'drainTransferQueue' : IDL.Func([], [], []),
    'getAcceptedtokens' : IDL.Func([IDL.Vec(IDL.Text)], [], []),
    'getPendingTransferCount' : IDL.Func([], [IDL.Nat], ['query']),
    'getTokenInfo' : IDL.Func(
        [],
        [
          IDL.Vec(
            IDL.Tuple(
              IDL.Text,
              IDL.Record({
                'Symbol' : IDL.Text,
                'Name' : IDL.Text,
                'TransferFee' : IDL.Nat,
                'Decimals' : IDL.Nat,
              }),
            )
          ),
        ],
        ['query'],
      ),
    'receiveTransferTasks' : IDL.Func(
        [IDL.Vec(IDL.Tuple(TransferRecipient, IDL.Nat, IDL.Text))],
        [IDL.Bool],
        [],
      ),
    'setOTCCanister' : IDL.Func([IDL.Text], [], []),
    'setTest' : IDL.Func([IDL.Bool], [], []),
  });
  return treasury;
};
export const init = ({ IDL }) => { return []; };
