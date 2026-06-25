const { execSync } = require('child_process');
const fs = require('fs');

function extractDocx(docxPath, label) {
  const tempDir = docxPath.replace('.docx', '_temp');
  try {
    execSync(`powershell -Command "Expand-Archive -Path '${docxPath}' -DestinationPath '${tempDir}' -Force"`, { timeout: 10000, shell: 'powershell' });
    const docXml = `${tempDir}\\word\\document.xml`;
    if (fs.existsSync(docXml)) {
      const xml = fs.readFileSync(docXml, 'utf-8');
      // Simple text extraction
      const text = xml.replace(/<w:p[ >]/g, '\n').replace(/<[^>]+>/g, '').replace(/&[^;]+;/g, ' ').replace(/\n+/g, '\n').trim();
      console.log('=== ' + label + ' ===');
      console.log(text.substring(0, 3000));
    } else {
      console.log(label + ': document.xml not found');
    }
    // Cleanup
    execSync(`powershell -Command "Remove-Item '${tempDir}' -Recurse -Force"`, { timeout: 5000, shell: 'powershell' });
  } catch(e) {
    console.log(label + ' error: ' + e.message.substring(0, 200));
  }
}

extractDocx('C:\\aicut\\index.docx', 'index.docx');
extractDocx('C:\\aicut\\robots.docx', 'robots.docx');
