// Global test setup
import { afterAll, afterEach, beforeAll, vi } from 'vitest'

// Mock environment variables
process.env.CLAUDE_API_KEY = 'test-key-mock'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.NEXTAUTH_SECRET = 'test-secret-mock'
process.env.NEXT_PUBLIC_DISABLE_AUTH = 'true'  // Authentication bypass for tests

// Test server manager
const TestServerManager = require('../../scripts/test-server-manager.js')
let testServerManager: any = null
let serverInfo: any = null

// Import node-fetch for Node.js environments
import fetch from 'node-fetch'

// Use real fetch for integration tests
if (!globalThis.fetch) {
  globalThis.fetch = fetch as any
}

// Mock console for cleaner test output
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
}

// Global test lifecycle management
beforeAll(async () => {
  console.log('🚀 Setting up production test server...')
  
  testServerManager = new TestServerManager()
  
  // Kill any existing processes first
  await testServerManager.killAllNextProcesses()
  
  // Start production server
  serverInfo = await testServerManager.startProductionServer()
  
  // Update environment with actual server info
  process.env.NEXTAUTH_URL = serverInfo.baseUrl
  
  console.log('✅ Test server ready:', serverInfo)
}, 120000) // 2 minutes timeout for server startup

afterAll(async () => {
  console.log('🛑 Shutting down test server...')
  
  if (testServerManager) {
    const stopInfo = await testServerManager.stopServer()
    console.log('✅ Test server stopped:', stopInfo)
  }
}, 30000) // 30 seconds timeout for shutdown

// Clean up after each test
afterEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
})

// Export server info for tests
export function getTestServerInfo() {
  return serverInfo || {
    port: 3000,
    baseUrl: 'http://localhost:3000',
    mode: 'production'
  }
}
