const fs = require('fs');
const c = fs.readFileSync('C:/aicut/index.html', 'utf8');

// Find 'process' section
const idx = c.indexOf('프로세스');
if (idx > 0) {
  const section = c.substring(idx, idx + 8000);
  
  // Find all image references
  const imgs = section.match(/<img[^>]+>/g) || [];
  console.log('Images in process section:', imgs.length);
  imgs.forEach((img, i) => console.log((i+1) + ': ' + img.substring(0, 200)));
  
  // background-image
  const bgImgs = section.match(/background-image[^;]+/g) || [];
  console.log('\nBackground images:', bgImgs.length);
  bgImgs.forEach(bg => console.log('  ' + bg.substring(0, 150)));
  
  // url() references
  const urls = section.match(/url\([^)]+\)/g) || [];
  console.log('\nURL references:', urls.length);
  urls.forEach(u => console.log('  ' + u.substring(0, 150)));
  
  // pexels or external image URLs
  const extUrls = section.match(/https?:\/\/[^"')\s]+\.(jpg|jpeg|png|gif|webp)/gi) || [];
  console.log('\nExternal image URLs:', extUrls.length);
  extUrls.forEach(u => console.log('  ' + u));
  
  // YouTube iframe
  const iframes = section.match(/<iframe[^>]+>/g) || [];
  console.log('\nIframes:', iframes.length);
  iframes.forEach(f => console.log('  ' + f.substring(0, 200)));
  
} else {
  console.log('Process section not found');
  // Try to find the index in the whole file
  const procIdx = c.indexOf('process');
  if (procIdx > 0) {
    console.log('Found "process" at position', procIdx);
    console.log(c.substring(procIdx, procIdx + 500));
  }
}
