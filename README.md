# box-mcp-server

## Setup

This MCP server currently supports only Developer Token authentication.

To use, you must set a `BOX_DEV_TOKEN` to a [Box Developer Token](https://developer.box.com/guides/authentication/tokens/developer-tokens/)

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