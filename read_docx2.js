const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function extractDocx(docxPath, label) {
  try {
    // Copy to .zip first then extract
    const zipPath = docxPath.replace('.docx', '.zip');
    fs.copyFileSync(docxPath, zipPath);
    
    const tempDir = docxPath.replace('.docx', '_temp');
    execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${tempDir}' -Force"`, { timeout: 10000, shell: 'powershell' });
    
    const docXml = path.join(tempDir, 'word', 'document.xml');
    if (fs.existsSync(docXml)) {
      const xml = fs.readFileSync(docXml, 'utf-8');
      const text = xml
        .replace(/<w:p[ >]/g, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&[^;]+;/g, ' ')
        .replace(/\n{2,}/g, '\n')
        .trim();
      console.log('=== ' + label + ' ===');
      console.log(text.substring(0, 4000));
    }
    
    // Cleanup
    fs.unlinkSync(zipPath);
    execSync(`powershell -Command "Remove-Item '${tempDir}' -Recurse -Force"`, { timeout: 5000, shell: 'powershell' });
  } catch(e) {
    console.log(label + ' error: ' + e.message.substring(0, 300));
  }
}

extractDocx('C:\\aicut\\index.docx', 'index.docx');
extractDocx('C:\\aicut\\robots.docx', 'robots.docx');
