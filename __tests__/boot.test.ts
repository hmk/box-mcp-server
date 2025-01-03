import { spawn } from 'child_process';
import path from 'path';
import packageJson from '../package.json';

// Increase timeout to 20 seconds since the server has to boot
// and we are testing STDIN / STDOUT which can be slow
jest.setTimeout(20000); 
let serverProcess: any;

beforeAll(() => {
  // Use the dist/index.js file as the entry point
  serverProcess = spawn('npx', ['tsx', path.resolve(__dirname, '../src/index.ts')], {
    env: {
      ...process.env,
      BOX_DEV_TOKEN: 'fake_test_token',
    },
    stdio: ['pipe', 'pipe', 'inherit'],
  });
});

afterAll(() => {
  if (serverProcess) {
    serverProcess.kill(); // Ensure the process is terminated
    serverProcess.stdout.removeAllListeners(); // Remove all listeners
    serverProcess.stderr?.removeAllListeners(); // Remove stderr listeners if any
    serverProcess.stdin?.end(); // Close stdin if necessary
  }
});

describe('box-mcp-server initialization', () => {
  it('should respond to the initialize method with the correct version over stdin/stdout', async () => {
    const requestPayload = JSON.stringify({
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'claude-ai',
          version: '0.1.0',
        },
      },
      jsonrpc: '2.0',
      id: 0,
    });

    const expectedResponse = JSON.stringify({
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          resources: {},
          tools: {},
        },
        serverInfo: {
          name: 'box-mcp-server',
          version: packageJson.version,
        },
      },
      jsonrpc: '2.0',
      id: 0,
    });

    return new Promise<void>((resolve, reject) => {
      let responseBuffer = '';
      let resolved = false;
    
      // Capture stdout data
      serverProcess.stdout.on('data', (data: Buffer) => {
        if (resolved) return; // Exit if the promise is already resolved
        responseBuffer += data.toString();
    
        try {
          console.log('Request payload:', requestPayload);
          const response = JSON.parse(responseBuffer);
          console.log('Response received:', response);
          expect(response).toEqual(JSON.parse(expectedResponse));
          resolved = true; // Mark as resolved
          resolve();
        } catch (error) {
          // Continue collecting data until it's a valid JSON response
        }
      });
    
      // Handle errors
      serverProcess.on('error', (err: Error) => {
        if (!resolved) {
          reject(err);
          resolved = true;
        }
      });
    
      // Send the request payload via stdin
      serverProcess.stdin.write(requestPayload + '\n');
    });
  });
});
