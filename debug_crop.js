import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', err => console.log('ERR:', err.toString()));
  
  await page.goto('http://localhost:5173');
  
  // Upload signature
  const sigInput = await page.$('#signature-upload');
  await sigInput.uploadFile('/tmp/test_signature.png');
  
  // wait for modal
  await page.waitForSelector('#crop-modal[open]');
  
  // click apply
  await page.click('#apply-crop-btn');
  
  await new Promise(r => setTimeout(r, 1000));
  await browser.close();
})();
