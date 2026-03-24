// STAGING LEADERBOARD CHECK
// Run this in console at https://wxunf-maaaa-aaaab-qbzga-cai.icp0.io/

(async function checkLeaderboards() {
  console.log('🔍 Checking Staging Leaderboards\n' + '='.repeat(50));

  // 1. Check if worker files are actually new
  console.log('\n📦 Worker Files:');
  const resources = performance.getEntriesByType('resource');
  const workers = resources.filter(r => r.name.includes('worker') && r.name.includes('.js'));

  workers.forEach(w => {
    const filename = w.name.split('/').pop();
    const hash = filename.match(/-([a-f0-9]{8})\./)?.[1];
    console.log(`   ${filename}`);
    console.log(`   Hash: ${hash}`);
    console.log(`   Expected: 6cb6c260 or 2b3be39c`);
    console.log(`   Match: ${hash === '6cb6c260' || hash === '2b3be39c' ? '✅' : '❌'}`);
    console.log('');
  });

  // 2. Check service workers
  console.log('\n🔧 Service Workers:');
  const swRegs = await navigator.serviceWorker.getRegistrations();
  console.log(`   Count: ${swRegs.length}`);
  if (swRegs.length > 0) {
    console.log('   ⚠️  Service worker detected - may be caching old files');
    console.log('   To clear: Run this in console:');
    console.log('   navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()))');
  } else {
    console.log('   ✅ No service workers');
  }

  // 3. Check IndexedDB
  console.log('\n💾 IndexedDB:');
  const dbs = await indexedDB.databases();
  const workerDB = dbs.find(db => db.name?.includes('taco-worker-cache'));
  if (workerDB) {
    console.log(`   Database: ${workerDB.name}`);
    console.log(`   Version: ${workerDB.name.includes('-v4') ? 'v4 ✅' : 'OLD ❌'}`);

    // Open and check for leaderboard keys
    const dbName = workerDB.name;
    const request = indexedDB.open(dbName);

    request.onsuccess = (event) => {
      const db = event.target.result;
      const tx = db.transaction(['data'], 'readonly');
      const store = tx.objectStore('data');
      const getAllKeys = store.getAllKeys();

      getAllKeys.onsuccess = () => {
        const keys = getAllKeys.result;
        console.log(`   Total keys: ${keys.length}`);

        // Check for leaderboard keys
        const leaderboardKeys = keys.filter(k => k.includes('leaderboard'));
        console.log(`\n🏆 Leaderboard Keys in Cache:`);
        if (leaderboardKeys.length > 0) {
          leaderboardKeys.forEach(k => console.log(`   ✅ ${k}`));

          // Get actual data from one key
          const getRequest = store.get('leaderboardAllTimeUSD');
          getRequest.onsuccess = () => {
            const data = getRequest.result;
            console.log(`\n📊 Sample Leaderboard Data (AllTimeUSD):`);
            if (data) {
              console.log(`   Has data: ${!!data}`);
              console.log(`   Type: ${typeof data}`);
              console.log(`   Length: ${Array.isArray(data) ? data.length : 'N/A'}`);
              if (Array.isArray(data) && data.length > 0) {
                console.log(`   First entry:`, data[0]);
              } else {
                console.log(`   ⚠️  Data is empty or not an array`);
              }
            } else {
              console.log(`   ❌ No data found`);
            }
          };
        } else {
          console.log('   ❌ No leaderboard keys found in cache');
          console.log('   This means workers have not fetched leaderboard data yet');
        }
      };
    };
  } else {
    console.log('   ❌ No worker database found');
  }

  console.log('\n' + '='.repeat(50));
  console.log('💡 If you see OLD worker hashes or service workers:');
  console.log('   1. Unregister service workers (see command above)');
  console.log('   2. Clear all site data (DevTools > Application > Clear storage)');
  console.log('   3. Hard refresh: Ctrl+Shift+R');
  console.log('   4. If still failing: chrome://restart');
})();
