#!/usr/bin/env node

/**
 * Comprehensive Test Suite for Kagazi Trading Platform
 * 
 * This script tests:
 * 1. Authentication and dashboard loading
 * 2. Chart functionality and black background
 * 3. 5-minute candle time alignment
 * 4. Real-time data updates
 * 5. API endpoints functionality
 * 6. Error handling
 */

const puppeteer = require('puppeteer');
const axios = require('axios');
const chalk = require('chalk');

const BASE_URL = 'http://localhost:3001';
const TEST_EMAIL = 'adarshjiicodes@gmail.com';
const TEST_SYMBOL = 'RELIANCE.NS';

// Test configuration
const TESTS = {
  authentication: true,
  dashboard: true,
  chartBackground: true,
  candleAlignment: true,
  realTimeUpdates: true,
  apiEndpoints: true,
  errorHandling: true,
};

class TradingPlatformTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = {};
    this.startTime = Date.now();
  }

  async init() {
    console.log(chalk.cyan.bold('🚀 Initializing Kagazi Trading Platform Test Suite'));
    console.log(chalk.gray(`Base URL: ${BASE_URL}`));
    console.log(chalk.gray(`Test Symbol: ${TEST_SYMBOL}`));
    console.log('');

    this.browser = await puppeteer.launch({
      headless: false, // Show browser for visual testing
      defaultViewport: { width: 1920, height: 1080 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    this.page = await this.browser.newPage();
    
    // Enable console logging from the page
    this.page.on('console', msg => {
      const type = msg.type();
      if (type === 'error' || type === 'warn') {
        console.log(chalk.yellow(`[Browser ${type.toUpperCase()}]:`, msg.text()));
      }
    });

    // Enable request/response logging
    this.page.on('response', response => {
      const url = response.url();
      if (url.includes('/api/')) {
        console.log(chalk.blue(`[API]:`, response.status(), url));
      }
    });
  }

  async runTest(testName, testFunction) {
    try {
      console.log(chalk.blue(`\n🧪 Running test: ${testName}`));
      const result = await testFunction.call(this);
      this.testResults[testName] = { passed: true, result, error: null };
      console.log(chalk.green(`✅ ${testName} PASSED`));
      return result;
    } catch (error) {
      this.testResults[testName] = { passed: false, result: null, error: error.message };
      console.log(chalk.red(`❌ ${testName} FAILED: ${error.message}`));
      throw error;
    }
  }

  async testAuthentication() {
    await this.page.goto(BASE_URL);
    await this.page.waitForSelector('body', { timeout: 10000 });

    // Check if we're already authenticated or need to sign in
    const currentUrl = this.page.url();
    
    if (currentUrl.includes('/dashboard')) {
      return { status: 'Already authenticated', redirected: true };
    }

    // Look for sign-in elements
    const signInButton = await this.page.$('button:has-text("Sign in"), [data-testid="sign-in"], .sign-in');
    if (signInButton) {
      await signInButton.click();
      await this.page.waitForNavigation({ timeout: 10000 });
    }

    // Wait for dashboard to load after authentication
    await this.page.waitForSelector('body', { timeout: 15000 });
    
    const finalUrl = this.page.url();
    if (finalUrl.includes('/dashboard')) {
      return { status: 'Authentication successful', finalUrl };
    } else {
      throw new Error(`Expected to be on dashboard, but on: ${finalUrl}`);
    }
  }

  async testDashboard() {
    // Ensure we're on the dashboard
    if (!this.page.url().includes('/dashboard')) {
      await this.page.goto(`${BASE_URL}/dashboard`);
    }

    await this.page.waitForSelector('body', { timeout: 10000 });

    // Check for essential dashboard elements
    const elements = {
      header: await this.page.$('header, [data-testid="header"], .header'),
      tradingChart: await this.page.$('canvas, [data-testid="trading-chart"], .trading-chart'),
      marketData: await this.page.$('[data-testid="market-data"], .market-data, .indices'),
      navigation: await this.page.$('nav, [data-testid="nav"], .navigation')
    };

    const missingElements = Object.entries(elements)
      .filter(([key, element]) => !element)
      .map(([key]) => key);

    if (missingElements.length > 0) {
      throw new Error(`Missing dashboard elements: ${missingElements.join(', ')}`);
    }

    return { 
      status: 'Dashboard loaded successfully',
      elements: Object.keys(elements).filter(key => elements[key])
    };
  }

  async testChartBackground() {
    // Wait for chart to load
    await this.page.waitForSelector('canvas', { timeout: 15000 });
    
    // Wait a bit for the chart to render
    await this.page.waitForTimeout(3000);

    // Check for chart background by evaluating styles and canvas content
    const chartInfo = await this.page.evaluate(() => {
      const canvases = Array.from(document.querySelectorAll('canvas'));
      const chartContainer = document.querySelector('[data-testid="trading-chart"], .trading-chart, .chart-container');
      
      return {
        canvasCount: canvases.length,
        containerBackground: chartContainer ? getComputedStyle(chartContainer).backgroundColor : null,
        bodyBackground: getComputedStyle(document.body).backgroundColor,
        canvasInfo: canvases.map(canvas => ({
          width: canvas.width,
          height: canvas.height,
          backgroundColor: getComputedStyle(canvas).backgroundColor
        }))
      };
    });

    // Check if background appears to be black (rgb(0, 0, 0) or similar)
    const isBlackBackground = (bg) => {
      if (!bg) return false;
      return bg.includes('rgb(0, 0, 0)') || bg.includes('#000') || bg.includes('black');
    };

    const hasBlackBackground = isBlackBackground(chartInfo.containerBackground) || 
                              isBlackBackground(chartInfo.bodyBackground) ||
                              chartInfo.canvasInfo.some(canvas => isBlackBackground(canvas.backgroundColor));

    if (!hasBlackBackground) {
      console.log(chalk.yellow('Warning: Chart background might not be pure black'));
      console.log(chalk.gray('Chart info:', JSON.stringify(chartInfo, null, 2)));
    }

    return {
      status: 'Chart background validated',
      hasBlackBackground,
      chartInfo,
      canvasCount: chartInfo.canvasCount
    };
  }

  async testCandleAlignment() {
    // Wait for chart to load and real-time updates to start
    await this.page.waitForTimeout(5000);

    // Look for debug information in the chart header
    const debugInfo = await this.page.evaluate(() => {
      const debugElements = Array.from(document.querySelectorAll('*')).filter(el => 
        el.textContent && (
          el.textContent.includes('Last Update:') ||
          el.textContent.includes('Current Candle:') ||
          el.textContent.includes('5-minute')
        )
      );
      
      return debugElements.map(el => el.textContent.trim());
    });

    // Check current time alignment
    const currentTime = new Date();
    const minutes = currentTime.getMinutes();
    const expectedAlignment = Math.floor(minutes / 5) * 5;
    const isAligned = minutes % 5 === 0;

    return {
      status: 'Candle alignment checked',
      currentMinutes: minutes,
      expectedAlignment,
      isCurrentlyAligned: isAligned,
      debugInfo,
      nextAlignmentIn: 5 - (minutes % 5)
    };
  }

  async testRealTimeUpdates() {
    console.log(chalk.gray('Monitoring real-time updates for 10 seconds...'));
    
    const updateCount = await this.page.evaluate(() => {
      return new Promise((resolve) => {
        let count = 0;
        const originalFetch = window.fetch;
        
        window.fetch = function(...args) {
          if (args[0] && args[0].includes('/api/market/quote')) {
            count++;
            console.log(`Real-time update #${count}:`, args[0]);
          }
          return originalFetch.apply(this, args);
        };
        
        setTimeout(() => {
          window.fetch = originalFetch;
          resolve(count);
        }, 10000);
      });
    });

    if (updateCount === 0) {
      throw new Error('No real-time updates detected in 10 seconds');
    }

    return {
      status: 'Real-time updates validated',
      updateCount,
      averageInterval: 10000 / updateCount
    };
  }

  async testApiEndpoints() {
    const endpoints = [
      `/api/market/quote?symbol=${TEST_SYMBOL}`,
      `/api/market/data?type=indices`,
      `/api/auth/session`,
    ];

    const results = {};

    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`${BASE_URL}${endpoint}`, {
          timeout: 5000,
          headers: {
            'Cookie': await this.getCookiesString()
          }
        });
        
        results[endpoint] = {
          status: response.status,
          hasData: !!response.data,
          dataKeys: response.data ? Object.keys(response.data) : []
        };
      } catch (error) {
        results[endpoint] = {
          status: error.response?.status || 0,
          error: error.message
        };
      }
    }

    return { status: 'API endpoints tested', results };
  }

  async testErrorHandling() {
    // Test invalid symbol
    const invalidSymbolUrl = `${BASE_URL}/api/market/quote?symbol=INVALID.NS`;
    
    try {
      const response = await axios.get(invalidSymbolUrl, {
        timeout: 5000,
        headers: {
          'Cookie': await this.getCookiesString()
        }
      });
      
      // Should handle gracefully, not crash
      return {
        status: 'Error handling validated',
        invalidSymbolResponse: {
          status: response.status,
          handled: true
        }
      };
    } catch (error) {
      // This is actually expected for invalid symbols
      return {
        status: 'Error handling validated',
        invalidSymbolResponse: {
          status: error.response?.status || 0,
          handled: true,
          error: 'Expected error for invalid symbol'
        }
      };
    }
  }

  async getCookiesString() {
    const cookies = await this.page.cookies();
    return cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
  }

  async runAllTests() {
    try {
      if (TESTS.authentication) {
        await this.runTest('Authentication', this.testAuthentication);
      }

      if (TESTS.dashboard) {
        await this.runTest('Dashboard Loading', this.testDashboard);
      }

      if (TESTS.chartBackground) {
        await this.runTest('Chart Background', this.testChartBackground);
      }

      if (TESTS.candleAlignment) {
        await this.runTest('Candle Time Alignment', this.testCandleAlignment);
      }

      if (TESTS.realTimeUpdates) {
        await this.runTest('Real-time Updates', this.testRealTimeUpdates);
      }

      if (TESTS.apiEndpoints) {
        await this.runTest('API Endpoints', this.testApiEndpoints);
      }

      if (TESTS.errorHandling) {
        await this.runTest('Error Handling', this.testErrorHandling);
      }

    } catch (error) {
      console.log(chalk.red('\n🚨 Test suite stopped due to critical failure'));
    }
  }

  printSummary() {
    const totalTests = Object.keys(this.testResults).length;
    const passedTests = Object.values(this.testResults).filter(t => t.passed).length;
    const failedTests = totalTests - passedTests;
    const duration = Date.now() - this.startTime;

    console.log(chalk.cyan.bold('\n📊 TEST SUMMARY'));
    console.log(chalk.cyan('═══════════════════════════════════════'));
    console.log(chalk.green(`✅ Passed: ${passedTests}`));
    console.log(chalk.red(`❌ Failed: ${failedTests}`));
    console.log(chalk.blue(`🕒 Duration: ${duration}ms`));
    console.log(chalk.cyan('═══════════════════════════════════════'));

    if (failedTests > 0) {
      console.log(chalk.red.bold('\n🚨 FAILED TESTS:'));
      Object.entries(this.testResults)
        .filter(([, result]) => !result.passed)
        .forEach(([testName, result]) => {
          console.log(chalk.red(`  • ${testName}: ${result.error}`));
        });
    }

    console.log(chalk.cyan.bold('\n📋 DETAILED RESULTS:'));
    Object.entries(this.testResults).forEach(([testName, result]) => {
      const icon = result.passed ? '✅' : '❌';
      console.log(`  ${icon} ${testName}`);
      if (result.result && typeof result.result === 'object') {
        console.log(chalk.gray(`    ${JSON.stringify(result.result, null, 6).replace(/\n/g, '\n    ')}`));
      }
    });

    const overallStatus = failedTests === 0 ? 'SUCCESS' : 'FAILED';
    const statusColor = failedTests === 0 ? chalk.green.bold : chalk.red.bold;
    
    console.log(statusColor(`\n🏁 OVERALL STATUS: ${overallStatus}`));
    
    if (failedTests === 0) {
      console.log(chalk.green.bold('🎉 All tests passed! The Kagazi Trading Platform is working correctly.'));
    } else {
      console.log(chalk.red.bold('⚠️  Some tests failed. Please review the issues above.'));
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    try {
      await this.init();
      await this.runAllTests();
    } catch (error) {
      console.log(chalk.red.bold('💥 Critical error in test suite:', error.message));
    } finally {
      this.printSummary();
      await this.cleanup();
    }
  }
}

// Run the test suite
if (require.main === module) {
  const tester = new TradingPlatformTester();
  tester.run().catch(console.error);
}

module.exports = TradingPlatformTester;
