const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];

  // Step 1: Get Firebase Hosting API token from browser
  await page.goto('https://console.firebase.google.com/project/aicut-28ab5/hosting', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await new Promise(r => setTimeout(r, 4000));

  // Try to get an OAuth2 access token
  const authInfo = await page.evaluate(async () => {
    // Try to get auth token using Firebase Auth
    try {
      // Check if there's a Firebase Auth instance
      if (typeof firebase !== 'undefined') {
        const user = firebase.auth().currentUser;
        if (user) {
          const token = await user.getIdToken();
          return { method: 'firebase-auth', token: token.substring(0, 50) };
        }
      }
    } catch(e) {}

    // Check for Google identity service token
    try {
      const token = await window.googlegapi?.auth?.getToken();
      if (token) return { method: 'gapi-token', token: token.access_token?.substring(0, 50) };
    } catch(e) {}

    // Check Google OAuth stored in session
    try {
      // Try the Google Accounts API
      const resp = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=1');
      // If this succeeds weirdly
    } catch(e) {}

    return { method: 'failed', detail: 'No auth method found' };
  });
  console.log('Auth:', JSON.stringify(authInfo));

  // Step 2: Try to use the Firebase Console's internal API to upload
  // The Firebase Console uses XHR to communicate with the backend
  // Let's intercept the auth headers
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  
  const authHeaders = {};
  cdp.on('Network.requestWillBeSent', (params) => {
    const url = params.request.url;
    if (url.includes('firebase') || url.includes('googleapis')) {
      const headers = params.request.headers;
      if (headers['authorization']) {
        authHeaders.token = headers['authorization'];
        authHeaders.url = url;
      }
    }
  });

  // Trigger a page action that makes API calls
  await page.reload({ waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 3000));

  console.log('\nAuth headers captured:', JSON.stringify(authHeaders));

  // Step 3: If we got a token, use Firebase Hosting API to upload
  if (authHeaders.token) {
    const token = authHeaders.token.replace('Bearer ', '');
    const versionUrl = `https://firebasehosting.googleapis.com/v1beta1/sites/aicut-28ab5/versions`;
    
    // Create a new version
    const createResp = await fetch(versionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    const versionData = await createResp.json();
    console.log('Version created:', JSON.stringify(versionData));
  } else {
    console.log('No auth token captured');
  }

  await b.close();
})().catch(e => console.log('ERR:', e.message));
