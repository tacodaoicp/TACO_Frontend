// TEST STAGING BACKEND DIRECTLY
// This tests if the backend canister has leaderboard data
// Run from your local terminal with node.js

const { Actor, HttpAgent } = require('@dfinity/agent');
const { idlFactory } = require('./.dfx/staging/canisters/Rewards/service.did.js');

const REWARDS_CANISTER_ID = 'YOUR_REWARDS_CANISTER_ID'; // Update this
const STAGING_HOST = 'https://icp0.io';

async function testLeaderboards() {
  console.log('🔍 Testing Staging Backend Leaderboards\n' + '='.repeat(50));

  try {
    // Create agent
    const agent = new HttpAgent({
      host: STAGING_HOST,
    });

    // Create actor
    const actor = Actor.createActor(idlFactory, {
      agent,
      canisterId: REWARDS_CANISTER_ID,
    });

    // Test individual leaderboard call
    console.log('\n📊 Testing getLeaderboard(AllTime, USD):');
    const allTimeUSD = await actor.getLeaderboard('AllTime', 'USD');
    console.log(`   Result type: ${typeof allTimeUSD}`);
    console.log(`   Has data: ${!!allTimeUSD}`);
    if (allTimeUSD && allTimeUSD.ok) {
      console.log(`   Entries: ${allTimeUSD.ok.length}`);
      if (allTimeUSD.ok.length > 0) {
        console.log(`   ✅ Backend has leaderboard data`);
        console.log(`   Sample entry:`, allTimeUSD.ok[0]);
      } else {
        console.log(`   ⚠️  Backend returned empty leaderboard`);
      }
    } else {
      console.log(`   ❌ Backend error or no data:`, allTimeUSD);
    }

    // Test composite endpoint
    console.log('\n📊 Testing getAllLeaderboards():');
    const allBoards = await actor.getAllLeaderboards();
    if (allBoards) {
      console.log(`   Result keys:`, Object.keys(allBoards));
      console.log(`   ✅ Composite endpoint works`);
    } else {
      console.log(`   ❌ Composite endpoint failed`);
    }

  } catch (error) {
    console.error('❌ Error testing backend:', error);
  }
}

testLeaderboards();
