export const idlFactory = ({ IDL }) => {
  return IDL.Service({
    'runMintingVaultTransactionTests' : IDL.Func([], [IDL.Text], []),
    'runTests' : IDL.Func([], [IDL.Text], []),
  });
};
export const init = ({ IDL }) => { return []; };
