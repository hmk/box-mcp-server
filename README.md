# box-mcp-server

![CI](https://github.com/hmk/box-mcp-server/actions/workflows/jest.yml/badge.svg?branch=main)

## Usage

### JSON Web Token (JWT) Authorization (recommended)

Using a JWT Config will allow persistent connection to Box. You will need a paid Box enterprise account, or you can sign up for a [free developer account](https://account.box.com/signup/n/developer) (make sure you are signed out of Box before clicking that link).

Begin by visiting the [Box Developer Console](https://app.box.com/developers/console) and create a new application. Make sure the authorization type is JSON Web Token.

Go to `Configuration > Add and Manage Public Keys` and Generate a Public/Private Keypair.
If you have not already, Box prompt you to set up 2 factor authentication and Authorize the application as an administrator in your box account. You will need to:

1. give the application `App + Enterprise Access`, and
2. enable the `make API calls using the as-user header` option

via the Box Application's Configuration page. **Make sure to reauthorize the application if you are modifying these settings**.

Download/store the configuration JSON somewhere on your computer. We will set the environment variable `BOX_JWT_CONFIG_PATH` to its location. We will also set the `BOX_USER_ID` to the user whose files we will be accessing. You can find your own Box User Id on your [account page](https://app.box.com/account). You can also set the `BOX_JWT` environment variable to the JSON itself (as an alternative to the path).

#### Claude Desktop Configuration

```json
{
  "mcpServers": {
    "box": {
      "command": "npx",
      "args": ["box-mcp-server"],
      "env": {
        "BOX_JWT_CONFIG_PATH": "/path/to/your/box-jwt-config.json",
        "BOX_USER_ID": "123456"
      }
    }
  }
}
```

### Developer Token Authorization (easiest)

Using a developer token is the easiest way to integrate with Box, but will only last 60 minutes.

To get started, set the `BOX_DEV_TOKEN` to a [Box Developer Token](https://developer.box.com/guides/authentication/tokens/developer-tokens/).

Begin by visiting the [Box Developer Console](https://app.box.com/developers/console) and create a new application. The authorization type does not currently matter, as all support Box Developer Token.

Once your application is created, navigate to its configuration setings and click `Generate Developer Token`.

#### Claude Desktop Configuration

```json
{
  "mcpServers": {
    "box": {
      "command": "npx",
      "args": ["box-mcp-server"],
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

- Node.js (v22 or higher)
- npm
- git

### Setting up Development Environment

To set up the development environment, follow these steps:

1. Fork the repository

   - Click the "Fork" button in the top-right corner of this repository
   - This creates your own copy of the repository under your Github acocunt

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
