export const idlFactory = ({ IDL }) => {
  return IDL.Service({ 'greet' : IDL.Func([IDL.Nat], [IDL.Text], []) });
};
export const init = ({ IDL }) => { return []; };
