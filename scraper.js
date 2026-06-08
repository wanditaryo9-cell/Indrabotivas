const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
require('dotenv').config();

class IvasScraper {
  constructor() {
    this.browser = null;
    this.page = null;
    this.email = process.env.IVAS_EMAIL;
    this.password = process.env.IVAS_PASSWORD;
  }

  async init() {
    try {
      this.browser = await puppeteer.launch({
        headless: process.env.HEADLESS === 'true',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ]
      });
      this.page = await this.browser.newPage();
      
      // Set user agent to avoid detection
      await this.page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      );
      
      console.log('✓ Browser initialized');
    } catch (error) {
      console.error('✗ Failed to initialize browser:', error.message);
      throw error;
    }
  }

  async login() {
    try {
      console.log('🔐 Attempting to login...');
      
      // Navigate to portal
      await this.page.goto('https://ivassms.com/portal', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Wait for login form
      await this.page.waitForSelector('input[type="text"]', { timeout: 10000 });

      // Fill login form
      await this.page.type('input[type="text"]', this.email);
      await this.page.type('input[type="password"]', this.password);

      // Click login button
      await this.page.click('button[type="submit"]');

      // Wait for navigation
      await this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });

      console.log('✓ Login successful');
      return true;
    } catch (error) {
      console.error('✗ Login failed:', error.message);
      return false;
    }
  }

  async getMyNumbers() {
    try {
      console.log('📱 Fetching My Numbers...');
      
      // Navigate to My Numbers page
      await this.page.goto('https://ivassms.com/portal/live/my_sms', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Get page content
      const content = await this.page.content();
      const $ = cheerio.load(content);

      // Extract numbers from the page
      const numbers = [];
      $('.my-numbers-item, [class*="number"]').each((index, element) => {
        const text = $(element).text().trim();
        if (/^\d+$/.test(text)) {
          numbers.push(text);
        }
      });

      // If not found with above selectors, try alternative approach
      if (numbers.length === 0) {
        // Look for phone numbers in text content
        const pageText = await this.page.evaluate(() => document.body.innerText);
        const phoneRegex = /\d{10,15}/g;
        const matches = pageText.match(phoneRegex) || [];
        numbers.push(...new Set(matches));
      }

      console.log(`✓ Found ${numbers.length} numbers`);
      return numbers;
    } catch (error) {
      console.error('✗ Failed to fetch My Numbers:', error.message);
      return [];
    }
  }

  async getSmsReceived() {
    try {
      console.log('📨 Fetching SMS Received...');
      
      // Navigate to SMS Received page
      await this.page.goto('https://ivassms.com/portal/sms/received', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Get page content
      const content = await this.page.content();
      const $ = cheerio.load(content);

      const smsList = [];

      // Extract SMS data from table rows
      $('table tbody tr, [class*="sms-row"]').each((index, element) => {
        const row = $(element);
        
        const sender = row.find('td').eq(0).text().trim();
        const message = row.find('td').eq(1).text().trim();
        const time = row.find('td').eq(2).text().trim();
        const service = row.find('[class*="badge"], [class*="tag"]').text().trim();

        if (message && sender) {
          smsList.push({
            sender,
            message,
            time,
            service,
            timestamp: new Date().toISOString()
          });
        }
      });

      console.log(`✓ Found ${smsList.length} SMS messages`);
      return smsList;
    } catch (error) {
      console.error('✗ Failed to fetch SMS Received:', error.message);
      return [];
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log('✓ Browser closed');
    }
  }
}

module.exports = IvasScraper;
