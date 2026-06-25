const fs = require('fs');
const data = require('C:/Users/paul/.openclaw/workspace/editmon_scraper.js');

// Actually, let me parse the output from the JSON embedded in the script output
const output = fs.readFileSync('C:/Users/paul/.openclaw/workspace/editmon_scraper.js', 'utf8');
console.log('Output already captured above');
