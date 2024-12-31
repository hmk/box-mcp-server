# box-mcp-server

## Usage

### Developer Token Authorization
This MCP server currently supports only Developer Token authentication.

To get started, set the `BOX_DEV_TOKEN` to a [Box Developer Token](https://developer.box.com/guides/authentication/tokens/developer-tokens/).

Begin by visiting the [Box Developer Console](https://app.box.com/developers/console) and create a new application. The authorization type does not currently matter, as all support Box Developer Token. 

Once your application is created, navigate to its configuration setings and click `Generate Developer Token`.

### Claude Desktop Configuration
```json
{
  "mcpServers": {
    "box": {
      "command": "npx",
      "args": [
        "box-mcp-server"
      ],
      "env": {
        "BOX_DEV_TOKEN": "YOUR_DEV_TOKEN_GOES_HERE"
      }
    }
  }
}
```

## Capabilities

1. Searching files
2. Reading files

- [x] PDF
- [x] Word
- [ ] Others

# Development

To set up the development environment, follow these steps:

1. Clone the repository:
    ```sh
    git clone https://github.com/yourusername/box-mcp.git
    cd box-mcp
    ```

2. Install dependencies:
    ```sh
    npm install
    ```

3. Set the `BOX_DEV_TOKEN` environment variable:
    ```sh
    export BOX_DEV_TOKEN=your_developer_token
    ```

4. Run watch to keep index.js updated:
    ```sh
    npm run watch
    ```

5. Start the model context protocol development server:
    ```sh
    npx @modelcontextprotocol/inspector node PATH_TO_YOUR_CLONED_REPO/dist/index.js
    ```

6. If the development server did not load the environment variable correctly, set the `BOX_DEV_TOKEN` on the left-hand side