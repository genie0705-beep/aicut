const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];

  // Navigate to Firebase Console
  await page.goto('https://console.firebase.google.com/project/aicut-28ab5/hosting', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await new Promise(r => setTimeout(r, 4000));

  // Try to get auth token via Firebase SDK in the page
  const result = await page.evaluate(async () => {
    // Try to get the Firebase app instance
    const apps = (typeof firebase !== 'undefined') ? firebase.apps : [];
    if (apps.length > 0) {
      const app = apps[0];
      try {
        const user = await firebase.auth().currentUser;
        if (user) {
          const token = await user.getIdToken();
          return { method: 'firebase', hasUser: true, tokenPrefix: token.substring(0, 20) };
        }
        return { method: 'firebase', hasUser: false };
      } catch(e) {
        return { method: 'firebase', error: e.message };
      }
    }

    // Try Google identity services
    if (typeof google !== 'undefined' && google.accounts) {
      return { method: 'gis', available: true };
    }

    // Check localStorage for Gaia auth
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.includes('gaia') || key.includes('oauth') || key.includes('token')) {
        return { method: 'localStorage', key: key, val: localStorage.getItem(key).substring(0, 50) };
      }
    }

    // Try sessionStorage
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key.includes('token') || key.includes('auth')) {
        return { method: 'sessionStorage', key: key, val: sessionStorage.getItem(key).substring(0, 50) };
      }
    }

    return { method: 'none' };
  });

  console.log(JSON.stringify(result, null, 2));
  
  // Also try to make an authenticated API call from the browser
  const apiResult = await page.evaluate(async () => {
    try {
      const resp = await fetch('https://firebasehosting.googleapis.com/v1beta1/sites/aicut-28ab5', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }
      });
      const data = await resp.json();
      return { status: resp.status, ok: resp.ok, data: JSON.stringify(data).substring(0, 200) };
    } catch(e) {
      return { error: e.message };
    }
  });
  
  console.log('\nAPI Result:', JSON.stringify(apiResult));

  await b.close();
})().catch(e => console.log('ERR:', e.message));
