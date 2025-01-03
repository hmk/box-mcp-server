import { spawn } from 'child_process';
import path from 'path';
import packageJson from '../package.json';

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
    serverProcess.kill();
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

      // Capture stdout data
      serverProcess.stdout.on('data', (data: Buffer) => {
        responseBuffer += data.toString();
        try {
          const response = JSON.parse(responseBuffer);
          expect(response).toEqual(JSON.parse(expectedResponse));
          resolve();
        } catch (error) {
          // Continue collecting data until it's a valid JSON response
        }
      });

      // Handle errors
      serverProcess.on('error', (err: Error) => {
        reject(err);
      });

      // Send the request payload via stdin
      serverProcess.stdin.write(requestPayload + '\n');
    });
  });
});
