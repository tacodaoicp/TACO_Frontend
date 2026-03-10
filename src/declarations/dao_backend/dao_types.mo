import Result "mo:base/Result";
import SpamProtection "../helper/spam_protection";
import Map "mo:map/Map";

module {

  public type PricePoint = {
    icpPrice : Nat;
    usdPrice : Float;
    time : Int;
  };
  public type TokenDetails = {
    Active : Bool;
    isPaused : Bool;
    epochAdded : Int;
    tokenName : Text;
    tokenSymbol : Text;
    tokenDecimals : Nat;
    tokenTransferFee : Nat;
    balance : Nat;
    priceInICP : Nat;
    priceInUSD : Float;
    tokenType : TokenType;
    pastPrices : [PricePoint];
    lastTimeSynced : Int; // if read from tokendetails in DAO, this will be the last time it was synced from treasury (and the opposite for treasury)
    pausedDueToSyncFailure : Bool;
  };

  public type PublicTokenDetails = {
    Active : Bool;
    isPaused : Bool;
    epochAdded : Int;
    tokenName : Text;
    tokenSymbol : Text;
    tokenDecimals : Nat;
    tokenTransferFee : Nat;
    balance : Nat;
    priceInICP : Nat;
    priceInUSD : Float;
    tokenType : TokenType;
    lastTimeSynced : Int;
    pausedDueToSyncFailure : Bool;
  };

  public type TokenDetailsWithoutPastPrices = (Principal, PublicTokenDetails);

  public type LogLevel = {
    #INFO;
    #WARN;
    #ERROR;
  };

  // Log entry structure
  public type LogEntry = {
    timestamp : Int;
    level : LogLevel;
    component : Text;
    message : Text;
    context : Text;
  };

  public type Holdings = {
    amount : Nat;
    valueUSD : Nat;
  };

  public type Allocation = {
    token : Principal;
    basisPoints : Nat;
  };

  public type NeuronVP = {
    neuronId : Blob;
    votingPower : Nat;
  };

  //tracking allocations per neuron
  public type NeuronAllocation = {
    allocations : [Allocation];
    lastUpdate : Int;
    votingPower : Nat;
    lastAllocationMaker : Principal;
  };

  // Map type for neuron allocations
  public type NeuronAllocationMap = Map.Map<Blob, NeuronAllocation>;

  // Voting power and allocation storage
  public type UserState = {
    // User's allocations
    allocations : [Allocation];
    // Last cached voting power from snapshot
    votingPower : Nat;
    // Timestamp when voting power was last updated
    lastVotingPowerUpdate : Int;
    // Last allocation update timestamp
    lastAllocationUpdate : Int;
    // Allocation maker
    lastAllocationMaker : Principal;
    // Past allocations max 50 saved
    pastAllocations : [{
      from : Int;
      to : Int;
      allocation : [Allocation];
      allocationMaker : Principal;
      note : ?Text;
    }];
    // Allocation follows, max 3
    allocationFollows : [{ since : Int; follow : Principal }];
    // Allocation followed by, max 50
    allocationFollowedBy : [{ since : Int; follow : Principal }];
    // Follow/unfollow actions last (Max saved depending on MAX_FOLLOW_UNFOLLOW_ACTIONS_PER_DAY)
    followUnfollowActions : [Int];
    neurons : [NeuronVP];
  };

  public type SystemState = {
    #Active;
    #Paused;
    #Emergency;
  };

  public type TokenType = {
    #ICP;
    #ICRC12;
    #ICRC3;
  };

  public type SyncError = {
    #NotTreasury;
    #UnexpectedError : Text;
  };

  public type SystemParameter = {
    #FollowDepth : Nat;
    #MaxFollowers : Nat;
    #MaxPastAllocations : Nat;
    #SnapshotInterval : Nat;
    #MaxTotalUpdates : Nat;
    #MaxAllocationsPerDay : Int;
    #AllocationWindow : Nat;
    #MaxFollowUnfollowActionsPerDay : Nat;
    #MaxFollowed : Nat;
    #LogAdmin : Principal;
  };

  public type UpdateError = {
    #SystemInactive;
    #InvalidAllocation;
    #UnexpectedError : Text;
    #NotAllowed;
    #NoVotingPower;
  };

  public type FollowError = {
    #NotAllowed;
    #NotAdmin;
    #AlreadyFollowing;
    #FollowLimitReached;
    #FolloweeNotFound;
    #FollowerNotFound;
    #FolloweeNoAllocationYetMade;
    #FollowerNoAllocationYetMade;
    #FolloweeIsSelf;
    #FolloweeLimitReached;
    #UnexpectedError : Text;
    #SystemInactive;
    #FollowUnfollowLimitReached;
  };

  public type UnfollowError = {
    #NotAllowed;
    #NotAdmin;
    #AlreadyUnfollowing;
    #FolloweeIsSelf;
    #FolloweeNotFound;
    #FollowerNotFound;
    #UnexpectedError : Text;
    #SystemInactive;
    #FollowUnfollowLimitReached;
  };

  // Wallet-specific types (separate from UserState to avoid migration issues)
  public type UserWalletData = {
    registeredTokens : [Principal];
    lastUpdated : Int;
  };

  public type TokenRegistrationError = {
    #NotAllowed;
    #TokenNotFound;
    #TokenAlreadyRegistered;
    #TokenNotRegistered;
    #MaxTokensReached;
    #SystemInactive;
    #UnexpectedError : Text;
  };

  public type AuthorizationError = {
    #NotAllowed;
    #NotAdmin;
    #UnexpectedError : Text;
  };

  public type RefreshError = {
    #NotAllowed;
    #SystemInactive;
    #SnsGovernanceError : Text;
    #NoNeuronsFound;
    #UnexpectedError : Text;
  };

  public type HistoricBalanceAllocation = {
    balances : [(Principal, Nat)]; // Token -> basis points of total balance
    allocations : [(Principal, Nat)]; // Token -> basis points of voting power allocation
    totalWorthInICP : Nat;
    totalWorthInUSD : Float;
  };

  // Admin action logging types for structured archiving
  public type AdminActionType = {
    #TokenAdd: {token: Principal; tokenType: TokenType; viaGovernance: Bool};
    #TokenRemove: {token: Principal};
    #TokenDelete: {token: Principal};
    #TokenPause: {token: Principal};
    #TokenUnpause: {token: Principal};
    #SystemStateChange: {oldState: SystemState; newState: SystemState};
    #ParameterUpdate: {parameter: SystemParameter; oldValue: Text; newValue: Text};
    #AdminPermissionGrant: {targetAdmin: Principal; function: Text; durationDays: Nat};
    #AdminAdd: {newAdmin: Principal};
    #AdminRemove: {removedAdmin: Principal};
    #CanisterStart;
    #CanisterStop;
  };

  public type AdminActionRecord = {
    id: Nat;
    timestamp: Int;
    admin: Principal;
    actionType: AdminActionType;
    reason: Text;
    success: Bool;
    errorMessage: ?Text;
  };

  public type AdminActionsSinceResponse = {
    actions: [AdminActionRecord];
    totalCount: Nat;
  };

  // Response types for existing DAO data (no new storage needed)
  public type AllocationChangesSinceResponse = {
    changes: [PastAllocationRecord];
    totalCount: Nat;
  };

  public type PastAllocationRecord = {
    user: Principal;
    from: Int;
    to: Int;
    allocation: [Allocation];
    allocationMaker: Principal;
  };

  public type FollowActionsSinceResponse = {
    follows: [FollowRecord];
    unfollows: [UnfollowRecord];
    totalCount: Nat;
  };

  public type FollowRecord = {
    follower: Principal;
    followed: Principal;
    since: Int;
  };

  public type UnfollowRecord = {
    follower: Principal;
    followed: Principal;
    until: Int; // When the follow ended
  };

  public type VotingPowerChangesSinceResponse = {
    users: [UserVotingPowerRecord];
    totalCount: Nat;
  };

  public type UserVotingPowerRecord = {
    user: Principal;
    votingPower: Nat;
    lastVotingPowerUpdate: Int;
    neurons: [NeuronVP];
  };

  public type NeuronUpdatesSinceResponse = {
    neurons: [NeuronRecord];
    totalCount: Nat;
  };

  public type NeuronRecord = {
    neuronId: Blob;
    votingPower: Nat;
    users: [Principal]; // Users who have this neuron
  };

  public type AllocationChangeType = {
    #UserUpdate: {userInitiated: Bool};
    #FollowAction: {followedUser: Principal};
    #SystemRebalance;
    #VotingPowerChange;
  };

  // NeuronAllocationChangeRecord with optional penaltyMultiplier for backward compatibility
  // null = no penalty (equivalent to 100), ?23 = 77% penalty
  public type NeuronAllocationChangeRecord = {
    timestamp: Int;
    neuronId: Blob;
    changeType: AllocationChangeType;
    oldAllocations: [Allocation];
    newAllocations: [Allocation];
    votingPower: Nat;
    maker: Principal;
    reason: ?Text;
    penaltyMultiplier: ?Nat; // null or ?100 = no penalty, ?23 = 77% penalty
  };

  public type NeuronAllocationChangesSinceResponse = {
    changes: [NeuronAllocationChangeRecord];
    totalCount: Nat;
  };

  public type Self = actor {
    updateAllocation : shared ([Allocation], ?Text) -> async Result.Result<Text, UpdateError>;
    getAggregateAllocation : shared query () -> async [(Principal, Nat)];
    getUserAllocation : shared query () -> async ?UserState;
    refreshUserVotingPower : shared () -> async Result.Result<{
      oldVotingPower: Nat;
      newVotingPower: Nat;
      neuronsUpdated: Nat;
      aggregateUpdated: Bool;
    }, RefreshError>;
    getSnapshotInfo : shared query () -> async {
      lastSnapshotId : Nat;
      lastSnapshotTime : Int;
      totalVotingPower : Nat;
    };
    addAdmin : shared (Principal) -> async Result.Result<Text, AuthorizationError>;
    removeAdmin : shared (Principal) -> async Result.Result<Text, AuthorizationError>;
    updateSystemState : shared (SystemState, Text) -> async Result.Result<Text, AuthorizationError>;
    updateSpamParameters : shared ({
      allowedCalls : ?Nat;
      allowedSilentWarnings : ?Nat;
      timeWindowSpamCheck : ?Int;
    }) -> async Result.Result<Text, AuthorizationError>;
    addToken : shared (Principal, TokenType) -> async Result.Result<Text, AuthorizationError>;
    addTokenWithReason : shared (Principal, TokenType, Text) -> async Result.Result<Text, AuthorizationError>;
    removeToken : shared (Principal, Text) -> async Result.Result<Text, AuthorizationError>;
    deleteToken : shared (Principal, Text) -> async Result.Result<Text, AuthorizationError>;
    pauseToken : shared (Principal, Text) -> async Result.Result<Text, AuthorizationError>;
    unpauseToken : shared (Principal, Text) -> async Result.Result<Text, AuthorizationError>;
    grantAdminPermission : shared (Principal, SpamProtection.AdminFunction, Nat) -> async Result.Result<Text, AuthorizationError>;
    getAdminPermissions : shared () -> async [(Principal, [SpamProtection.AdminPermission])];
    votingPowerMetrics : shared () -> async Result.Result<{ totalVotingPower : Nat; totalVotingPowerByHotkeySetters : Nat; allocatedVotingPower : Nat }, AuthorizationError>;
    followAllocation : shared (Principal) -> async Result.Result<Text, FollowError>;
    unfollowAllocation : shared (Principal) -> async Result.Result<Text, UnfollowError>;
    syncTokenDetailsFromTreasury : shared () -> async Result.Result<Text, SyncError>;
    getSystemParameters : shared () -> async [SystemParameter];
    getTokenDetails : shared () -> async [(Principal, TokenDetails)];
    getAdminActionsSince : shared query (Int, Nat) -> async Result.Result<AdminActionsSinceResponse, AuthorizationError>;
    getAllocationChangesSince : shared query (Int, Nat) -> async Result.Result<AllocationChangesSinceResponse, AuthorizationError>;
    getFollowActionsSince : shared query (Int, Nat) -> async Result.Result<FollowActionsSinceResponse, AuthorizationError>;
    getVotingPowerChangesSince : shared query (Int, Nat) -> async Result.Result<VotingPowerChangesSinceResponse, AuthorizationError>;
    getNeuronUpdatesSince : shared query (Int, Nat) -> async Result.Result<NeuronUpdatesSinceResponse, AuthorizationError>;
    getNeuronAllocationChangesSince : shared query (Int, Nat) -> async Result.Result<NeuronAllocationChangesSinceResponse, AuthorizationError>;

    // Penalized neurons management (DAO-only VP reduction)
    admin_setPenalizedNeurons : shared ([(Blob, Nat)]) -> async Result.Result<Nat, AuthorizationError>;
    admin_addPenalizedNeuron : shared (Blob, Nat) -> async Result.Result<(), AuthorizationError>;
    admin_removePenalizedNeuron : shared (Blob) -> async Result.Result<Bool, AuthorizationError>;
    getPenalizedNeurons : shared query () -> async [(Blob, Nat)];
    getPenalizedNeuronsCount : shared query () -> async Nat;
  };
};
