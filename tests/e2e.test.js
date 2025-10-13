const puppeteer = require('puppeteer');

describe('Voting System E2E Tests', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  test('should load the landing page', async () => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('h1');
    
    const title = await page.$eval('h1', el => el.textContent);
    expect(title).toContain('Simple & Secure');
  });

  test('should navigate to signin page', async () => {
    await page.goto('http://localhost:3000');
    await page.click('a[href="/signin"]');
    await page.waitForSelector('h2');
    
    const signinTitle = await page.$eval('h2', el => el.textContent);
    expect(signinTitle).toContain('Welcome back');
  });

  test('should navigate to signup page', async () => {
    await page.goto('http://localhost:3000');
    await page.click('a[href="/signup"]');
    await page.waitForSelector('h2');
    
    const signupTitle = await page.$eval('h2', el => el.textContent);
    expect(signupTitle).toContain('Create your account');
  });

  test('should have responsive design', async () => {
    await page.goto('http://localhost:3000');
    
    // Test mobile viewport
    await page.setViewport({ width: 375, height: 667 });
    await page.waitForSelector('nav');
    
    // Test desktop viewport
    await page.setViewport({ width: 1024, height: 768 });
    await page.waitForSelector('nav');
  });
});
