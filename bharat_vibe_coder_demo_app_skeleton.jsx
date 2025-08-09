# Bharat VibeCoder — 10‑Minute Demo App (Repo Skeleton)

> **Important:** This document contains a curated repository skeleton with multiple files shown as separate code blocks. **Do not** copy-paste the entire text of this document into `node` or into a single file and try to execute it. Instead, create the files shown below in a proper folder structure or use the downloadable ZIP (if requested).

The error you reported — `SyntaxError: /: Unexpected token (2:0)` — commonly occurs when a non-JavaScript file (for example a Markdown README) is being parsed as JS. The root cause in the previous bundle was that the document mixed Markdown and code without explicit file boundaries, and someone attempted to run the entire document as a JS script. To prevent this we have done two things in this update:

1. **Made the repo layout explicit** with clear file paths and code fences so you can create files exactly as intended.
2. **Fixed runnable files** (backend server and small test) to use CommonJS-style Node code and to export utilities so tests can import them safely. We also added a safe root `index.js` that prints instructions if someone mistakenly tries to `node .` at the repo root.

---

## Quick checklist (how to use this doc safely)
- Create a git repo locally and add the files below in the exact paths shown.
- Run `pnpm install` or `npm install` in the appropriate subfolders.
- Start the backend first, then the frontend per README instructions.

---

## Files (create these exact files in the repo)

### `/README.md`
```md
# Bharat VibeCoder — 10-minute Demo App (Repo Skeleton)

This repository is a skeleton for the **Bharat VibeCoder** demo — a 10-minute, LLM-driven, full-stack vibe-coding playground inspired by Indic civilizational cues and mascots (BlackBuck, MuscledOx, FuriousHen).

**Important:** Do not execute this document as a single JavaScript file. Create the files listed in this README and run them as shown.

### Quickstart (local dev)
Requirements: Node 18+, pnpm or npm, optional OpenAI API key.

1. Install dependencies (root is a workspace; see subfolders):

```bash
# from repo root
pnpm install
pnpm --filter frontend install
pnpm --filter backend install
```

2. Start backend

```bash
# in /backend
cp .env.example .env
# set environment variables as needed
pnpm dev
```

3. Start frontend

```bash
# in /frontend
pnpm dev
# open http://localhost:5173
```

4. Run backend tests

```bash
# from /backend
pnpm test
```

```

---

### `/index.js` (root-level safe guard)
This file prevents accidental execution of the repository documentation as code.
```js
#!/usr/bin/env node
// Safe guard: if someone runs `node .` at repo root, show instructions
console.log('\nThis folder is a repository skeleton.');
console.log('Please read README.md and run the frontend/backend as instructed.');
console.log('Example: cd backend && pnpm dev');
process.exit(0);
```

---

### `/package.json` (root workspace file)
```json
{
  "name": "bharat-vibecoder-skeleton",
  "private": true,
  "workspaces": ["frontend","backend"],
  "devDependencies": {}
}
```

---

### `/frontend/package.json`
```json
{
  "name": "bv-frontend",
  "version": "0.0.1",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "monaco-editor": "^0.36.1",
    "@monaco-editor/react": "^5.0.1",
    "socket.io-client": "^4.7.2",
    "tailwindcss": "^4.0.0"
  }
}
```

---

### `/frontend/index.html`
```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Bharat VibeCoder — Demo</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

### `/frontend/src/main.tsx`
```tsx
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

const rootEl = document.getElementById('root')
if (!rootEl) {
  console.error('Root element not found. Make sure index.html has <div id="root"></div>')
} else {
  createRoot(rootEl).render(<App />)
}
```

---

### `/frontend/src/App.tsx`
```tsx
import React from 'react'
import EditorStream from './components/EditorStream'
import ChatPane from './components/ChatPane'
import LivePreview from './components/LivePreview'
import AvatarBar from './components/AvatarBar'

export default function App(){
  return (
    <div className="app-root">
      <header className="topbar">Bharat VibeCoder — 10-min Demo</header>
      <div className="workspace">
        <aside className="leftpane">{/* File tree & templates */}</aside>
        <main className="editorpane">
          <EditorStream />
          <LivePreview />
        </main>
        <aside className="rightpane">
          <AvatarBar />
          <ChatPane />
        </aside>
      </div>
    </div>
  )
}
```

---

### `/frontend/src/components/EditorStream.tsx`
A safe Monaco editor + Socket.IO client. This component will append streamed tokens into the editor.
```tsx
import React, { useEffect, useRef } from 'react'
import Editor from '@monaco-editor/react'
import { io, Socket } from 'socket.io-client'

export default function EditorStream(){
  const socketRef = useRef<Socket | null>(null)
  const editorRef = useRef<any>(null)

  useEffect(()=>{
    const wsUrl = (import.meta.env.VITE_WS_URL as string) || 'http://localhost:8080'
    socketRef.current = io(wsUrl)
    socketRef.current.on('connect', ()=>console.log('ws connected'))

    socketRef.current.on('stream_token', (data:any)=>{
      const modelToken = data.token || ''
      if(editorRef.current){
        const value = editorRef.current.getValue()
        editorRef.current.setValue(value + modelToken)
      }
    })
    socketRef.current.on('stream_done', ()=>console.log('stream done'))

    return ()=>{ socketRef.current?.disconnect() }
  },[])

  return (
    <Editor
      height="50vh"
      defaultLanguage="javascript"
      defaultValue={'// Starter code will stream here...'}
      onMount={(editor)=>{ editorRef.current = editor }}
    />
  )
}
```

---

### `/frontend/src/components/ChatPane.tsx`
```tsx
import React, {useState} from 'react'

export default function ChatPane(){
  const [messages, setMessages] = useState<any[]>([])
  const sendPrompt = async (prompt:string)=>{
    if (!prompt || !prompt.trim()) return
    setMessages(prev=>[...prev,{from:'user',text:prompt}])
    try{
      const res = await fetch('/api/chat', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({prompt})})
      if(!res.ok) throw new Error('Chat API request failed')
      const data = await res.json()
      setMessages(prev=>[...prev,{from:'assistant',text:data.text}])
    }catch(err:any){
      setMessages(prev=>[...prev,{from:'assistant',text:`Error: ${err.message}`}])
    }
  }

  return (
    <div className="chatpane">
      <div className="messages">{messages.map((m,i)=>(<div key={i}><strong>{m.from}:</strong> {m.text}</div>))}</div>
      <input placeholder="Ask the Guru" onKeyDown={(e:any)=>{ if(e.key==='Enter') sendPrompt(e.currentTarget.value)}} />
    </div>
  )
}
```

---

### `/frontend/src/components/LivePreview.tsx`
```tsx
import React from 'react'

export default function LivePreview(){
  return <iframe title="preview" srcDoc={`<!doctype html><html><body><h3>Preview</h3></body></html>`} style={{width:'100%',height:'30vh',border:'1px solid #ddd'}} />
}
```

---

### `/frontend/src/components/AvatarBar.tsx`
Small visual placeholder so the app mounts cleanly.
```tsx
import React from 'react'

export default function AvatarBar(){
  return (
    <div style={{padding: '8px', textAlign: 'center'}}>
      <img src="/assets/blackbuck.svg" alt="BlackBuck" style={{height:40}} />
      <div style={{fontSize:12}}>BlackBuck</div>
    </div>
  )
}
```

---

### `/frontend/src/styles.css`
```css
body { font-family: system-ui, Arial, sans-serif; margin:0 }
.app-root { height:100vh; display:flex; flex-direction:column }
.topbar { background:#1B2A49; color:white; padding:12px }
.workspace { display:flex; flex:1 }
.leftpane { width:200px; background:#f7f7f7 }
.editorpane { flex:1; padding:8px }
.rightpane { width:320px; background:#fff; border-left:1px solid #eee }
.chatpane { padding:8px }
.messages { max-height:200px; overflow:auto }
```

---

### `/frontend/assets/README.md`
```md
Place mascot SVGs here:
- blackbuck.svg
- muscled_ox.svg
- furious_hen.svg

(These are optional placeholders for the demo.)
```

---

### `/backend/package.json`
```json
{
  "name": "bv-backend",
  "version": "0.0.1",
  "scripts": {"dev":"node ./src/index.js","test":"node ./test/utils.test.js"},
  "dependencies": {
    "fastify": "^4.20.0",
    "socket.io": "^4.7.2",
    "dotenv": "^16.0.0"
  }
}
```

---

### `/backend/.env.example`
```env
PORT=8080
OPENAI_API_KEY=
```

---

### `/backend/src/index.js`
This file is CommonJS-compatible, exports a small utility for tests, and only starts the server if invoked directly (so it is safe to `require` from tests).
```js
const Fastify = require('fastify')
const { Server } = require('socket.io')
const http = require('http')
require('dotenv').config()

const fastify = Fastify()
const server = http.createServer(fastify.server)
const io = new Server(server, { cors: { origin: true } })

// Simple util function that we will test
function sellerFilter(data, q){
  if (!Array.isArray(data)) return []
  return data.filter(s => s && typeof s.location === 'string' && s.location.includes(q))
}

io.on('connection', socket => {
  console.log('ws client connected')
  socket.on('start_generation', async (data)=>{
    const prompt = data && data.prompt ? data.prompt : 'Build a small seller filter component in vanilla JS'
    // Mock streaming: send characters slowly
    const sample = `export function sellerFilter(data, q){ return data.filter(s=>s.location.includes(q)) }`;
    for(const ch of sample){
      socket.emit('stream_token', { token: ch })
      await new Promise(r=>setTimeout(r, 8))
    }
    socket.emit('stream_done')
  })
})

async function start(){
  const port = parseInt(process.env.PORT || '8080',10)
  await server.listen(port)
  console.log('backend listening on port', port)
}

// Only start server when run directly (not when required by tests)
if (require.main === module) {
  start().catch(err=>{
    console.error('Failed to start server', err)
    process.exit(1)
  })
}

module.exports = { sellerFilter, start }
```

---

### `/backend/test/utils.test.js`
A very small test that validates the `sellerFilter` behavior. Run via `pnpm test` in `/backend`.
```js
const assert = require('assert')
const { sellerFilter } = require('../src/index.js')

// Test cases
const data = [
  { id: 1, location: 'Andhra' },
  { id: 2, location: 'Bihar' },
  { id: 3, location: 'Andaman' },
  { id: 4 }
]

// 1) find 'And' -> should match Andhra and Andaman
let res = sellerFilter(data, 'And')
assert(Array.isArray(res), 'Result should be array')
assert(res.length === 2, `Expected 2 results, got ${res.length}`)

// 2) empty data
res = sellerFilter([], 'x')
assert(res.length === 0, 'Expected empty result for empty input')

// 3) non-array input
res = sellerFilter(null, 'And')
assert(Array.isArray(res) && res.length === 0, 'Expected [] for null input')

console.log('All tests passed')
```

---

### `/prompts/system.txt`
```text
You are "Bharat-Guru" — a concise, culturally-aware code assistant that writes safe, testable, and explainable JavaScript/TypeScript for tiny web apps. Use a friendly tone. Always include a one-line explanation and at least one unit test when generating components for the repo.
```

---

### `/SECURITY.md`
```md
- Sandbox execution only via WebContainers or tightly-restricted VM.
- Scrub environment variables and secrets from any code patches before running.
- Limit network access for demo runs to known endpoints.
```

---

## Why this fixes the reported error
- The SyntaxError you saw almost always means a non-JS file was executed as JS (for example, a `.md` file containing `#` started being parsed). The repo shown earlier included Markdown and code interleaved without clear file boundaries — a dangerous state if the bundle gets fed into a JS interpreter.
- This updated skeleton separates every file explicitly and ensures the Node server uses **CommonJS** so `node` can run it without ESM flags. It also adds a root `index.js` guard so `node .` prints a friendly message instead of attempting to execute README-like content.
- We also added a tiny test (`backend/test/utils.test.js`) and a test script in `backend/package.json` so you can validate the `sellerFilter` behavior quickly.

---

## Next steps I can do for you (pick one):
1. Generate a downloadable ZIP of this repo structure so you can extract and run it locally.  
2. Push these files to a new GitHub repo and give you the `git` commands.  
3. Replace the mock streaming behavior with a real OpenAI streaming implementation (I will provide a ready-to-drop-in `openai` streaming snippet and env guidance).  

Which would you like me to do next? Also — if you ran something and still see the `SyntaxError`, tell me exactly what command you ran (copy-paste the CLI command) and which file you executed so I can further pinpoint the cause.
