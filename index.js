#!/usr/bin/env node
'use strict';

/**
 * DebugVault MCP Server
 * 
 * Connects your IDE to DebugVault's production bug database.
 * Search 5,530+ real bugs, get AI-powered debugging, and post bounties.
 * 
 * Usage:
 *   DEBUGVAULT_API_KEY=dv_xxx npx debugvault-mcp
 * 
 * Or add to your MCP config (Claude Code, Cursor, etc):
 *   {
 *     "mcpServers": {
 *       "debugvault": {
 *         "command": "npx",
 *         "args": ["debugvault-mcp"],
 *         "env": { "DEBUGVAULT_API_KEY": "dv_xxx" }
 *       }
 *     }
 *   }
 */

const { Readable, Writable } = require('stream');
const https = require('https');
const http = require('http');

const API_BASE = process.env.DEBUGVAULT_URL || 'https://debugvlt.com';
const API_KEY = process.env.DEBUGVAULT_API_KEY || '';

// ─── HTTP Client ────────────────────────────────────────────────

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const mod = url.protocol === 'https:' ? https : http;
    const opts = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(API_KEY ? { 'Authorization': `Bearer ${API_KEY}` } : {}),
      },
    };
    const req = mod.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve({ raw: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ─── Tools ──────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'search_bugs',
    description: 'Search 5,530+ production bugs by error message. Returns root causes, fixes, and confidence scores. Free, no credits needed.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Error message, stack trace, or bug description to search for' },
      },
      required: ['query'],
    },
  },
  {
    name: 'debug_error',
    description: 'AI-powered error diagnosis. Searches the vault first, then uses AI (Gemini Flash/Pro or Claude Sonnet) for deep analysis. Returns ranked matches with confidence scores, root cause, and fix.',
    inputSchema: {
      type: 'object',
      properties: {
        error: { type: 'string', description: 'The error message or stack trace' },
        context: { type: 'string', description: 'Additional context — what you were doing, framework, recent changes' },
        model: { type: 'string', enum: ['flash', 'pro', 'sonnet'], description: 'AI model: flash (free/3cr), pro (8cr), sonnet (12cr). Default: flash' },
      },
      required: ['error'],
    },
  },
  {
    name: 'get_bug',
    description: 'Get full details of a specific bug by its ID, including root cause, fix code, prevention tips, and related patterns.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Bug ID (from search results)' },
      },
      required: ['id'],
    },
  },
  {
    name: 'list_categories',
    description: 'List all bug categories with counts. Useful for exploring what types of bugs are in the vault.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'post_bounty',
    description: 'Post a bug to the DebugVault bounty marketplace for community debugging. Requires Pro tier or above.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Short descriptive bug title' },
        symptom: { type: 'string', description: 'Error message or symptom description' },
        stack: { type: 'string', description: 'Tech stack (e.g., "React, Node.js, PostgreSQL")' },
        severity: { type: 'string', enum: ['easy', 'medium', 'hard', 'critical'], description: 'Bug difficulty/severity' },
      },
      required: ['title', 'symptom', 'stack', 'severity'],
    },
  },
];

async function handleToolCall(name, args) {
  switch (name) {
    case 'search_bugs': {
      const result = await request('POST', '/api/search', { query: (args.query || '').slice(0, 500) });
      return JSON.stringify(result, null, 2);
    }
    case 'debug_error': {
      const result = await request('POST', '/api/debug', {
        error: (args.error || '').slice(0, 1500),
        context: args.context ? String(args.context).slice(0, 2000) : undefined,
        model: args.model || 'flash',
      });
      return JSON.stringify(result, null, 2);
    }
    case 'get_bug': {
      const result = await request('GET', `/api/bugs/${args.id}`);
      return JSON.stringify(result, null, 2);
    }
    case 'list_categories': {
      const result = await request('GET', '/api/bugs/categories');
      return JSON.stringify(result, null, 2);
    }
    case 'post_bounty': {
      const result = await request('POST', '/api/mcp', {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: { name: 'post_bounty', arguments: args },
      });
      if (result.result?.content?.[0]?.text) return result.result.content[0].text;
      return JSON.stringify(result, null, 2);
    }
    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}

// ─── JSON-RPC over stdio ────────────────────────────────────────

let buffer = '';

function sendResponse(id, result) {
  const msg = JSON.stringify({ jsonrpc: '2.0', id, result });
  process.stdout.write(`Content-Length: ${Buffer.byteLength(msg)}\r\n\r\n${msg}`);
}

function sendError(id, code, message) {
  const msg = JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } });
  process.stdout.write(`Content-Length: ${Buffer.byteLength(msg)}\r\n\r\n${msg}`);
}

async function handleMessage(msg) {
  const { method, id, params } = msg;

  switch (method) {
    case 'initialize':
      sendResponse(id, {
        protocolVersion: '2024-11-05',
        serverInfo: { name: 'debugvault', version: '1.0.0' },
        capabilities: { tools: {} },
      });
      break;

    case 'notifications/initialized':
      // No response needed for notifications
      break;

    case 'tools/list':
      sendResponse(id, { tools: TOOLS });
      break;

    case 'tools/call': {
      const { name, arguments: args } = params;
      try {
        const text = await handleToolCall(name, args || {});
        sendResponse(id, { content: [{ type: 'text', text }] });
      } catch (err) {
        sendResponse(id, { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true });
      }
      break;
    }

    default:
      if (id !== undefined) {
        sendError(id, -32601, `Method not found: ${method}`);
      }
  }
}

// Parse Content-Length delimited messages from stdin
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  buffer += chunk;
  
  while (true) {
    const headerEnd = buffer.indexOf('\r\n\r\n');
    if (headerEnd === -1) break;

    const header = buffer.slice(0, headerEnd);
    const match = header.match(/Content-Length:\s*(\d+)/i);
    if (!match) {
      buffer = buffer.slice(headerEnd + 4);
      continue;
    }

    const contentLength = parseInt(match[1], 10);
    const bodyStart = headerEnd + 4;

    if (buffer.length < bodyStart + contentLength) break;

    const body = buffer.slice(bodyStart, bodyStart + contentLength);
    buffer = buffer.slice(bodyStart + contentLength);

    try {
      const msg = JSON.parse(body);
      handleMessage(msg).catch((err) => {
        process.stderr.write(`Error handling message: ${err.message}\n`);
      });
    } catch (err) {
      process.stderr.write(`Failed to parse message: ${err.message}\n`);
    }
  }
});

process.stderr.write('DebugVault MCP server started\n');
