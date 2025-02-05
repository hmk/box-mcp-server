#!/usr/bin/env node

import process from 'process';
if (process.env.NODE_ENV !== 'development') {
  process.removeAllListeners('warning');
}

const originalConsoleLog = console.log;
console.log = (message, ...args) => {
  if (!message.startsWith("Warning: ")) {
    originalConsoleLog(message, ...args);
  }
};

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { BoxClient, BoxDeveloperTokenAuth, BoxJwtAuth, JwtConfig } from "box-typescript-sdk-gen";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import * as mammoth from "mammoth";

console.log = originalConsoleLog;

// Initialize Box client based on auth method
let auth: BoxDeveloperTokenAuth | BoxJwtAuth;
if (process.env.BOX_DEV_TOKEN) {
  auth = new BoxDeveloperTokenAuth({ token: process.env.BOX_DEV_TOKEN });
} else if (process.env.BOX_JWT_CONFIG_PATH && process.env.BOX_USER_ID) {
  const jwtConfig = JwtConfig.fromConfigFile(process.env.BOX_JWT_CONFIG_PATH);
  const jwtAuth = new BoxJwtAuth({ config: jwtConfig });
  const userAuth = jwtAuth.withUserSubject(process.env.BOX_USER_ID);
  auth = userAuth;
} else if (process.env.BOX_JWT && process.env.BOX_USER_ID) {
  const jwtConfig = JwtConfig.fromConfigJsonString(process.env.BOX_JWT);
  const jwtAuth = new BoxJwtAuth({ config: jwtConfig });
  const userAuth = jwtAuth.withUserSubject(process.env.BOX_USER_ID);
  auth = userAuth;
} else if (process.env.BOX_JWT_BASE64 && process.env.BOX_USER_ID) {
  const decodedJwt = Buffer.from(process.env.BOX_JWT_BASE64, "base64").toString("utf-8");
  const jwtConfig = JwtConfig.fromConfigJsonString(decodedJwt);
  const jwtAuth = new BoxJwtAuth({ config: jwtConfig });
  const userAuth = jwtAuth.withUserSubject(process.env.BOX_USER_ID);
  auth = userAuth;
} else {
  throw new Error("BOX_DEV_TOKEN or BOX_USER_ID && (BOX_JWT || BOX_JWT_CONFIG_PATH) must be set as environment variable(s)");
}
const client = new BoxClient({ auth });

// Shared file reading functionality
async function readBoxFile(fileId: string) {
  // Get file info to check type
  const fileInfo = await client.files.getFileById(fileId);
  const fileType = fileInfo.name?.split(".").pop()?.toLowerCase();

  if (!fileType) {
    throw new Error("Failed to determine file type");
  }

  // Download file content
  const fileContentStream = await client.downloads.downloadFile(fileId);

  if (!fileContentStream) {
    throw new Error("Failed to download file content");
  }

  const fileContent = await new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    fileContentStream.on("data", (chunk) => chunks.push(chunk));
    fileContentStream.on("end", () => resolve(Buffer.concat(chunks)));
    fileContentStream.on("error", reject);
  });

  let textContent;

  // Process based on file type
  switch (fileType) {
    case "pdf":
      // Load PDF document
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(fileContent.buffer),
        useSystemFonts: true,
        verbosity: 0,
      });

      const pdfDocument = await loadingTask.promise;

      // Extract text from all pages
      let extractedPages = [];
      for (let i = 1; i <= pdfDocument.numPages; i++) {
        const page = await pdfDocument.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items
          .map((item) => ("str" in item ? item.str : ""))
          .join(" ");
        extractedPages.push(pageText);
      }

      textContent = extractedPages.join("\n\n");
      break;

    case "doc":
    case "docx":
      const result = await mammoth.extractRawText({
        buffer: Buffer.from(fileContent.buffer),
      });
      textContent = result.value;
      break;

    case "txt":
    case "md":
    case "json":
    case "csv":
      // For text files, convert buffer to string
      textContent = fileContent.toString();
      break;

    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }

  return textContent;
}

// Initialize the MCP server
const server = new Server(
  {
    name: 'box-mcp-server',
    version: '0.3.1',
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  try {
    const rootFolder = await client.folders.getFolderItems("0");

    const resources =
      rootFolder.entries?.map((entry) => ({
        uri: `box://${entry.type}/${entry.id}`,
        name: entry.name || "Untitled",
        description:
          entry.type === "folder"
            ? `Box folder - use this URI to list contents`
            : `Box file - use this URI to read contents`,
        mimeType: entry.type === "file" ? "text/plain" : undefined,
      })) || [];

    return {
      resources,
      description:
        "Shows items in Box root folder. Use folder URIs to traverse deeper, or use the search tool to find specific items.",
    };
  } catch (error) {
    console.error("Error listing resources:", error);
    throw error;
  }
});

// Read resource content
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri as string;

  // Validate URI format
  if (!uri.startsWith("box://file/")) {
    throw new Error(
      "Invalid URI format. Must start with box://file/ but was " + uri
    );
  }

  // Extract file ID from URI
  const fileId = uri.replace("box://file/", "");

  try {
    const textContent = await readBoxFile(fileId);

    return {
      contents: [
        {
          type: "text",
          text: textContent,
          uri: request.params.uri,
        },
      ],
    };
  } catch (error) {
    console.error("Error reading file:", error);
    throw error;
  }
});

// Add search tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "search",
        description:
          "Search for files and folders across all of Box (not limited to root folder). Returns URIs that can be used with resource commands.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description:
                "Search query - finds items anywhere in Box, not just root folder",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "read",
        description: "Read the content of a Box file directly",
        inputSchema: {
          type: "object",
          properties: {
            uri: {
              type: "string",
              description:
                "Box resource URI of the file to read (must start with box://file/)",
            },
          },
          required: ["uri"],
        },
      },
    ],
  };
});

// Add tool handlers
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  // read tool
  if (request.params.name === "read") {
    const uri = request.params.arguments?.uri as string;

    // Validate URI format
    if (!uri.startsWith("box://file/")) {
      throw new Error(
        "Invalid URI format. Must start with box://file/ but was " + uri
      );
    }

    // Extract file ID from URI
    const fileId = uri.replace("box://file/", "");

    try {
      const textContent = await readBoxFile(fileId);

      return {
        content: [
          {
            type: "text",
            text: textContent,
          },
        ],
      };
    } catch (error) {
      console.error("Error reading file:", error);
      throw error;
    }
  }

  // search tool
  if (request.params.name === "search") {
    const query = request.params.arguments?.query as string;

    try {
      const searchResults = await client.search.searchForContent({
        query,
        limit: 20,
      });

      const resources =
        searchResults.entries?.reduce(
          (acc, entry) => {
            if ("id" in entry && "type" in entry) {
              acc.push({
                uri: `box://${entry.type}/${entry.id}`,
                name: entry.name || `Untitled ${entry.type}`,
                description: `Box ${entry.type}`,
                mimeType: entry.type === "file" ? "text/plain" : undefined,
              });
            }
            return acc;
          },
          [] as Array<{
            uri: string;
            name: string;
            description: string;
            mimeType?: string;
          }>
        ) || [];

      // Format the results as text and include resource URIs
      const formattedResults = resources
        .map((resource) => `- ${resource.name} (${resource.uri})`)
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text: `Found ${resources.length} items matching "${query}":\n\n${formattedResults}`,
          },
        ],
      };
    } catch (error) {
      console.error("Error performing search:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error performing search: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
      };
    }
  }

  throw new Error(`Unknown tool: ${request.params.name}`);
});

const transport = new StdioServerTransport();
await server.connect(transport);
