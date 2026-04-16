const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--window-size=1920,1080'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  const DIR = 'experiments/video-frames';
  const BASE = 'https://agent-registry-seven.vercel.app';
  const wait = (ms) => new Promise(r => setTimeout(r, ms));

  console.log('1. Homepage...');
  await page.goto(BASE + '/', { waitUntil: 'networkidle0', timeout: 30000 }).catch(()=>{});
  await wait(5000);
  await page.screenshot({ path: DIR + '/app-01-home.png' });

  console.log('2. Agent registry...');
  await page.goto(BASE + '/agents', { waitUntil: 'networkidle0', timeout: 30000 }).catch(()=>{});
  await wait(12000);
  await page.screenshot({ path: DIR + '/app-02-agents.png' });

  console.log('3. Agent detail...');
  await page.goto(BASE + '/agents/4902', { waitUntil: 'networkidle0', timeout: 30000 }).catch(()=>{});
  await wait(5000);
  await page.screenshot({ path: DIR + '/app-03-overview.png' });

  console.log('4. Transactions tab...');
  const btns = await page.$$('button');
  for (const b of btns) {
    const t = await b.evaluate(el => el.textContent);
    if (t && t.includes('Transactions')) { await b.click(); break; }
  }
  await wait(4000);
  await page.screenshot({ path: DIR + '/app-04-transactions.png' });

  console.log('5. Financials tab...');
  const btns2 = await page.$$('button');
  for (const b of btns2) {
    const t = await b.evaluate(el => el.textContent);
    if (t && t.includes('Financials')) { await b.click(); break; }
  }
  await wait(4000);
  await page.screenshot({ path: DIR + '/app-05-financials.png' });

  console.log('6. Explorer...');
  await page.goto(BASE + '/explorer', { waitUntil: 'networkidle0', timeout: 30000 }).catch(()=>{});
  await wait(8000);
  await page.screenshot({ path: DIR + '/app-06-explorer.png' });

  await browser.close();
  console.log('All 6 screenshots captured!');
})();
