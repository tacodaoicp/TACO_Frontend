// ============================================================================
// Worker Verification Script
// Copy/paste this into Chrome DevTools Console (F12) to verify updates
// ============================================================================

(async function verifyWorkerUpdate() {
  console.log('🔍 TACO Worker Verification\n' + '='.repeat(50));

  // 1. Check IndexedDB version
  console.log('\n📦 IndexedDB Check:');
  try {
    const dbs = await indexedDB.databases();
    const workerDB = dbs.find(db => db.name?.includes('taco-worker-cache'));
    if (workerDB) {
      const isV4 = workerDB.name.includes('-v4');
      console.log(`   Database: ${workerDB.name}`);
      console.log(`   ${isV4 ? '✅' : '❌'} Version: ${isV4 ? 'v4 (UPDATED)' : 'OLD VERSION'}`);
    } else {
      console.log('   ⚠️  No worker cache database found');
    }
  } catch (err) {
    console.log('   ❌ Error checking IndexedDB:', err);
  }

  // 2. Check worker bridge version
  console.log('\n🔧 Worker Bridge Check:');
  try {
    // Try to access the worker bridge from window
    const scripts = performance.getEntriesByType('resource').filter(r => r.name.includes('.js'));
    const workerFiles = scripts.filter(s =>
      s.name.includes('worker') &&
      !s.name.includes('service')
    );

    console.log(`   Found ${workerFiles.length} worker file(s):`);
    workerFiles.forEach(w => {
      const filename = w.name.split('/').pop();
      const isAuthenticated = filename.includes('authenticated');
      const isPublic = filename.includes('public');
      const hash = filename.match(/-([a-f0-9]{8})\./)?.[1];

      console.log(`   ${isAuthenticated ? '✅' : isPublic ? '❌' : '⚠️ '} ${filename}`);
      if (hash) {
        const expectedAuthHash = '6cb6c260';
        const expectedDedicatedHash = '2b3be39c';
        const isCorrectHash = hash === expectedAuthHash || hash === expectedDedicatedHash;
        console.log(`      Hash: ${hash} ${isCorrectHash ? '✅ CORRECT' : '⚠️  UNEXPECTED'}`);
      }
    });

    const hasPublic = workerFiles.some(w => w.name.includes('public'));
    const hasAuth = workerFiles.some(w => w.name.includes('authenticated'));

    if (hasPublic) {
      console.log('\n   ❌ PUBLIC WORKER STILL LOADING - Page not updated!');
    } else if (hasAuth) {
      console.log('\n   ✅ Using unified authenticated worker only');
    } else {
      console.log('\n   ⚠️  No worker files detected');
    }
  } catch (err) {
    console.log('   ❌ Error checking workers:', err);
  }

  // 3. Check specific file timestamps
  console.log('\n⏰ Resource Timing:');
  try {
    const authWorker = performance.getEntriesByType('resource').find(r =>
      r.name.includes('authenticated.worker') && r.name.includes('.js')
    );
    if (authWorker) {
      const loadTime = new Date(performance.timeOrigin + authWorker.startTime);
      console.log(`   Authenticated worker loaded at: ${loadTime.toLocaleTimeString()}`);
      console.log(`   Duration: ${authWorker.duration.toFixed(2)}ms`);
    }
  } catch (err) {
    console.log('   ⚠️  Could not check timing');
  }

  // 4. Check worker data keys
  console.log('\n🔑 Worker Data Keys Check:');
  try {
    // Open the IndexedDB and check what keys are stored
    const dbName = (await indexedDB.databases()).find(db =>
      db.name?.includes('taco-worker-cache')
    )?.name;

    if (dbName) {
      const request = indexedDB.open(dbName);
      request.onsuccess = (event) => {
        const db = event.target.result;
        const tx = db.transaction(['data'], 'readonly');
        const store = tx.objectStore('data');
        const getAllRequest = store.getAllKeys();

        getAllRequest.onsuccess = () => {
          const keys = getAllRequest.result;
          console.log(`   Total cached keys: ${keys.length}`);

          // Check for public keys
          const publicKeys = ['cryptoPrices', 'tokenDetails', 'tradingStatus', 'leaderboardAllTimeUSD'];
          const foundPublic = publicKeys.filter(k => keys.includes(k));
          console.log(`   Public keys found: ${foundPublic.join(', ')}`);

          // Check for user keys
          const userKeys = ['userAllocation', 'userPerformance', 'swapDashboard'];
          const foundUser = userKeys.filter(k => keys.includes(k));
          if (foundUser.length > 0) {
            console.log(`   User keys found: ${foundUser.join(', ')}`);
          }
        };
      };
    }
  } catch (err) {
    console.log('   ⚠️  Could not enumerate keys');
  }

  // 5. Summary
  console.log('\n' + '='.repeat(50));
  console.log('📋 SUMMARY:');
  console.log('   To confirm update is live:');
  console.log('   1. IndexedDB should be "taco-worker-cache-v4"');
  console.log('   2. Should load authenticated.worker-6cb6c260.js');
  console.log('   3. Should load authenticated.dedicated.worker-2b3be39c.js');
  console.log('   4. Should NOT load any public.worker files');
  console.log('\n   If you see old versions:');
  console.log('   - Hard refresh: Ctrl+Shift+R');
  console.log('   - Or type: chrome://restart');
  console.log('='.repeat(50));
})();
