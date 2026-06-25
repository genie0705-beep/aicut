const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];

  const siteName = 'aicut-28ab5';
  const filesDir = 'C:\\aicut';
  
  // Read files to upload
  const filesToUpload = {};
  for (const file of ['index.html', 'robots.txt', 'sitemap.xml']) {
    const content = fs.readFileSync(path.join(filesDir, file), 'utf-8');
    filesToUpload[file] = content;
  }

  // Navigate to Firebase Hosting
  await page.goto('https://console.firebase.google.com/project/' + siteName + '/hosting/sites/' + siteName, {
    waitUntil: 'domcontentloaded', timeout: 20000
  });
  await new Promise(r => setTimeout(r, 4000));

  // Use the browser's fetch API with existing session to call Firebase Hosting API
  const result = await page.evaluate(async (siteName) => {
    // First get the Firebase auth token from IDB or session
    // Then try to use the Firebase Hosting REST API
    
    const apiBase = 'https://firebasehosting.googleapis.com/v1beta1/sites/' + siteName;
    
    // Step 1: Create a new version
    const createResp = await fetch(apiBase + '/versions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const version = await createResp.json();
    console.log('Version:', JSON.stringify(version));
    return { version };
  }, siteName);

  console.log('Result:', JSON.stringify(result));

  await b.close();
})().catch(e => console.log('ERR:', e.message));
