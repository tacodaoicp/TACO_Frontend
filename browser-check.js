// COMPLETE BROWSER CHECK - Paste this in console on staging site
// https://wxunf-maaaa-aaaab-qbzga-cai.icp0.io/

(async function completeCheck() {
  console.log('🔍 COMPLETE STAGING CHECK\n' + '='.repeat(70));

  // 1. Check worker files
  console.log('\n📦 WORKER FILES:');
  const workers = performance.getEntriesByType('resource')
    .filter(r => r.name.includes('worker') && r.name.endsWith('.js'));

  if (workers.length === 0) {
    console.log('   ❌ NO WORKER FILES FOUND!');
    console.log('   This means workers are not loading at all.');
  } else {
    workers.forEach(w => {
      const url = new URL(w.name);
      const filename = url.pathname.split('/').pop();
      const hash = filename.match(/-([a-f0-9]{8})\./)?.[1];
      const isPublic = filename.includes('public');
      const isAuth = filename.includes('authenticated');

      console.log(`   File: ${filename}`);
      console.log(`   Type: ${isPublic ? '❌ PUBLIC (OLD)' : isAuth ? '✅ AUTHENTICATED' : '⚠️  UNKNOWN'}`);
      console.log(`   Hash: ${hash}`);
      console.log(`   Expected: 6cb6c260 or 2b3be39c`);
      console.log(`   Status: ${(hash === '6cb6c260' || hash === '2b3be39c') ? '✅ UPDATED' : '❌ OLD HASH'}`);
      console.log('');
    });
  }

  // 2. Check for service workers (these can cache old files)
  console.log('\n🔧 SERVICE WORKERS:');
  try {
    const swRegs = await navigator.serviceWorker.getRegistrations();
    if (swRegs.length > 0) {
      console.log(`   ⚠️  ${swRegs.length} service worker(s) found!`);
      console.log('   These may be caching old worker files.');
      console.log('   TO FIX: Run this command:');
      console.log('   navigator.serviceWorker.getRegistrations().then(r => r.forEach(sw => sw.unregister()))');
    } else {
      console.log('   ✅ No service workers');
    }
  } catch (e) {
    console.log('   ⚠️  Could not check service workers');
  }

  // 3. Check IndexedDB
  console.log('\n💾 INDEXEDDB:');
  const dbs = await indexedDB.databases();
  const workerDBs = dbs.filter(db => db.name?.includes('taco-worker-cache'));

  if (workerDBs.length === 0) {
    console.log('   ❌ NO WORKER DATABASE FOUND!');
    console.log('   Workers have not initialized.');
  } else {
    console.log(`   Found ${workerDBs.length} database(s):`);
    workerDBs.forEach(db => {
      const isV4 = db.name.includes('-v4');
      console.log(`   ${isV4 ? '✅' : '❌'} ${db.name} ${isV4 ? '(CORRECT)' : '(OLD - DELETE THIS)'}`);
    });

    // Check what's in the v4 database
    const v4db = workerDBs.find(db => db.name.includes('-v4'));
    if (v4db) {
      console.log(`\n   Checking ${v4db.name} contents...`);
      const request = indexedDB.open(v4db.name);

      request.onsuccess = (event) => {
        const db = event.target.result;
        const tx = db.transaction(['data'], 'readonly');
        const store = tx.objectStore('data');
        const getAllKeys = store.getAllKeys();

        getAllKeys.onsuccess = () => {
          const allKeys = getAllKeys.result;
          console.log(`   📊 Total keys in DB: ${allKeys.length}`);

          // Check leaderboard keys
          const leaderboardKeys = allKeys.filter(k => k.toString().includes('leaderboard'));
          console.log(`\n🏆 LEADERBOARD KEYS:`);
          if (leaderboardKeys.length > 0) {
            console.log(`   Found ${leaderboardKeys.length} leaderboard key(s):`);
            leaderboardKeys.forEach(k => console.log(`   ✅ ${k}`));

            // Get sample data
            const sampleKey = 'leaderboardAllTimeUSD';
            const getRequest = store.get(sampleKey);
            getRequest.onsuccess = () => {
              const data = getRequest.result;
              console.log(`\n   📈 Sample: ${sampleKey}`);
              if (data) {
                console.log(`   ✅ Has data: ${typeof data}`);
                if (Array.isArray(data)) {
                  console.log(`   ✅ Is array: ${data.length} entries`);
                  if (data.length > 0) {
                    console.log(`   ✅ First entry:`, data[0]);
                  } else {
                    console.log(`   ⚠️  Array is empty`);
                  }
                } else if (data && typeof data === 'object') {
                  console.log(`   ✅ Is object with keys:`, Object.keys(data));
                } else {
                  console.log(`   ⚠️  Unexpected data type:`, data);
                }
              } else {
                console.log(`   ❌ No data for ${sampleKey}`);
              }
            };
          } else {
            console.log(`   ❌ NO LEADERBOARD KEYS FOUND!`);
            console.log(`   This means leaderboards have never been fetched.`);
            console.log(`\n   Available keys:`);
            allKeys.slice(0, 10).forEach(k => console.log(`   - ${k}`));
            if (allKeys.length > 10) {
              console.log(`   ... and ${allKeys.length - 10} more`);
            }
          }
        };
      };

      request.onerror = () => {
        console.log('   ❌ Could not open database');
      };
    }
  }

  // 4. Check Vue store (if accessible)
  console.log('\n🎯 VUE STORE CHECK:');
  try {
    // Try to access the Vue app
    const app = document.querySelector('#app')?.__vue_app__;
    if (app) {
      console.log('   ✅ Vue app found');
      // Try to get the store
      const store = app.config.globalProperties.$store || window.__PINIA__;
      if (store) {
        console.log('   ✅ Store accessible');
        console.log('   Check store.cachedLeaderboardAllTimeUSD in console');
      } else {
        console.log('   ⚠️  Store not accessible via standard methods');
      }
    } else {
      console.log('   ⚠️  Vue app not found');
    }
  } catch (e) {
    console.log('   ⚠️  Could not access Vue store:', e.message);
  }

  // 5. Check for console errors
  console.log('\n⚠️  ERROR CHECK:');
  console.log('   Look above for any red errors mentioning:');
  console.log('   - "leaderboard"');
  console.log('   - "worker"');
  console.log('   - "fetch"');
  console.log('   If you see errors, that\'s likely the issue.');

  // Final summary
  console.log('\n' + '='.repeat(70));
  console.log('📋 NEXT STEPS:');
  console.log('   1. If you see OLD worker hashes → Hard refresh (Ctrl+Shift+R)');
  console.log('   2. If you see service workers → Unregister them (command above)');
  console.log('   3. If you see old databases (v3) → Delete them:');
  console.log('      Application tab → Storage → IndexedDB → Right-click old DB → Delete');
  console.log('   4. If no leaderboard keys in v4 DB → Workers never fetched them');
  console.log('      Try navigating to /performance or /rewards page');
  console.log('   5. Nuclear option: Application → Clear site data → Reload');
  console.log('='.repeat(70));
})();
