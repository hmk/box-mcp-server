# box-mcp-server

![CI](https://github.com/hmk/box-mcp-server/actions/workflows/jest.yml/badge.svg?branch=main)

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

## Development

### Prerequisites

Before you begin, ensure you have the following installed:

* Node.js (v22 or higher)
* npm
* git

### Setting up Development Environment

To set up the development environment, follow these steps:

1. Fork the repository
   * Click the "Fork" button in the top-right corner of this repository
   * This creates your own copy of the repository under your Github acocunt

2. Clone Your Fork:
    ```sh
    git clone https://github.com/YOUR_USERNAME/box-mcp-server.git
    cd box-mcp-server
    ```

3. Add Upstream Remote
   ```sh
   git remote add upstream https://github.com/hmk/box-mcp-server.git
   ```
4. Install dependencies:
    ```sh
    npm install
    ```

5. Set the `BOX_DEV_TOKEN` environment variable:
    ```sh
    export BOX_DEV_TOKEN=your_developer_token
    ```

6. Run watch to keep index.js updated:
    ```sh
    npm run watch
    ```

7. Start the model context protocol development server:
    ```sh
    npx @modelcontextprotocol/inspector node PATH_TO_YOUR_CLONED_REPO/dist/index.js
    ```

8. If the development server did not load the environment variable correctly, set the `BOX_DEV_TOKEN` on the left-hand side of the mcp inspector.
