#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');

// ProCheff API Test Suite
const API_BASE = 'http://localhost:3000';

const tests = [
  {
    name: '🏥 Health Check',
    url: `${API_BASE}/api/health`,
    method: 'GET'
  },
  {
    name: '🤖 Claude API',
    url: `${API_BASE}/api/claude`,
    method: 'POST',
    data: { message: 'Test message' }
  },
  {
    name: '🍽️ Menu Analysis',
    url: `${API_BASE}/api/menu/analyze`,
    method: 'POST',
    data: { 
      menuText: 'Tavuk Döner, Lahmacun, Köfte',
      restaurantType: 'fast food'
    }
  },
  {
    name: '🏪 Market Prices',
    url: `${API_BASE}/api/market/prices?product=tavuk&market=migros`,
    method: 'GET'
  },
  {
    name: '💰 Offer Calculation',
    url: `${API_BASE}/api/offer/calc`,
    method: 'POST',
    data: {
      items: [
        { name: 'Tavuk Döner', quantity: 10, unitPrice: 25 }
      ],
      discountRate: 10
    }
  }
];

async function testAPI(test) {
  return new Promise((resolve) => {
    const curlArgs = ['-s', '-w', '%{http_code}'];
    
    if (test.method === 'POST') {
      curlArgs.push('-X', 'POST');
      curlArgs.push('-H', 'Content-Type: application/json');
      if (test.data) {
        curlArgs.push('-d', JSON.stringify(test.data));
      }
    }
    
    curlArgs.push(test.url);
    
    const curl = spawn('curl', curlArgs);
    let response = '';
    
    curl.stdout.on('data', (data) => {
      response += data.toString();
    });
    
    curl.on('close', (code) => {
      const statusCode = response.slice(-3);
      const body = response.slice(0, -3);
      
      resolve({
        name: test.name,
        status: statusCode,
        success: statusCode.startsWith('2'),
        body: body.length > 100 ? body.substring(0, 100) + '...' : body
      });
    });
  });
}

async function runTests() {
  console.log('🧪 ProCheff API Test Suite Starting...\n');
  
  const results = [];
  
  for (const test of tests) {
    process.stdout.write(`Testing ${test.name}... `);
    const result = await testAPI(test);
    results.push(result);
    
    if (result.success) {
      console.log(`✅ ${result.status}`);
    } else {
      console.log(`❌ ${result.status}`);
    }
  }
  
  console.log('\n📊 Test Results:');
  console.log('==================');
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.name} - ${result.status}`);
    if (!result.success && result.body) {
      console.log(`   Error: ${result.body}`);
    }
  });
  
  const passedTests = results.filter(r => r.success).length;
  console.log(`\n🎯 ${passedTests}/${results.length} tests passed`);
  
  if (passedTests === results.length) {
    console.log('🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed');
    process.exit(1);
  }
}

// Check if server is running
const healthCheck = spawn('curl', ['-f', `${API_BASE}/api/health`]);
healthCheck.on('close', (code) => {
  if (code !== 0) {
    console.log('❌ Server not running! Start with: npm run dev');
    process.exit(1);
  } else {
    runTests();
  }
});
