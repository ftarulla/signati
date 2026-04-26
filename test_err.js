import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', err => console.log('ERR:', err.toString()));
  
  await page.goto('http://localhost:5173');
  
  // Upload files
  const pdfInput = await page.$('#pdf-upload');
  await pdfInput.uploadFile('/tmp/test_doc.pdf');
  
  const sigInput = await page.$('#signature-upload');
  await sigInput.uploadFile('/tmp/test_signature.png');
  
  await page.waitForSelector('#download-btn:not([disabled])');
  
  page.on('dialog', async dialog => {
    console.log('ALERT:', dialog.message());
    await dialog.dismiss();
  });

  await page.click('#download-btn');
  
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
