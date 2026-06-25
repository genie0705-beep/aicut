const { PDFParse } = require('pdf-parse');
const fs = require('fs');

const baseDir = 'C:/Users/paul/Desktop/120_화신기계상사_자료_260602-20260612T053452Z-3-001/120_화신기계상사_자료_260602';
const files = [
  '기능정의서_화신기계상사_ERP.pdf',
  '메뉴정의서_화신기계상사_ERP.pdf',
  '프로세스정의서_화신기계상사_ERP.pdf'
];

(async () => {
  for (const file of files) {
    const filePath = baseDir + '/' + file;
    console.log('\n========== ' + file + ' ==========');
    
    try {
      const data = new Uint8Array(fs.readFileSync(filePath));
      const pdf = new PDFParse(data);
      await pdf.load();
      
      const result = await pdf.getText();
      const text = result.text;
      
      console.log('Total chars: ' + text.length);
      console.log('--- First 3000 chars ---');
      console.log(text.substring(0, 3000));
      
      // Save
      const outPath = 'C:/Users/paul/.openclaw/workspace/' + file.replace('.pdf', '.txt');
      fs.writeFileSync(outPath, text, 'utf-8');
      console.log('\n(Full text saved to: ' + outPath + ')');
      
    } catch(e) {
      console.log('Error: ' + e.message.substring(0, 200));
    }
  }
})().catch(e => console.log('FATAL: ' + e.message));
