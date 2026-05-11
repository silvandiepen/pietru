import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const shots = [
    ['https://pietru.dev', '/tmp/pietru-marketing-home.png'],
    ['https://pietru.dev/features', '/tmp/pietru-marketing-features.png'],
    ['https://pietru.dev/pricing', '/tmp/pietru-marketing-pricing.png'],
  ];

  for (const [url, path] of shots) {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.screenshot({ path, fullPage: true });
    console.log(`Screenshot saved to ${path}`);
  }

  await browser.close();
})();
