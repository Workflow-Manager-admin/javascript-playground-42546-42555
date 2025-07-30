import React, { useState, useRef } from 'react';
import './App.css';
import './Playground.css';

// Theme colors from requirements
const COLORS = {
  accent: "#f7df1e",
  primary: "#282c34",
  secondary: "#61dafb"
};

const DEFAULT_SNIPPET = `// JavaScript Playground Demo
console.log("Hello, JavaScript! 👋");

function greet(name) {
  return "Hello, " + name + "!";
}

console.log(greet("World"));
`;

// PUBLIC_INTERFACE
function App() {
  const [code, setCode] = useState(DEFAULT_SNIPPET);
  const [output, setOutput] = useState('');
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState(null);
  const iframeRef = useRef();

  // PUBLIC_INTERFACE
  function handleRun() {
    setOutput('');
    setError(null);
    setExecuting(true);
    // Sandbox eval: execute in a hidden iframe for isolation
    const iframe = iframeRef.current;
    if (iframe) {
      // Reset iframe content for each run
      iframe.srcdoc = `<script>
        window.onerror = function(msg) {
          window.parent.postMessage({ type: "error", msg }, "*");
        };
        var captured = [];
        var oldLog = console.log;
        console.log = function(...args) {
          captured.push(args.map(String).join(" "));
          oldLog.apply(console, args);
          window.parent.postMessage({ type: "log", msg: args.map(String).join(" ") }, "*");
        };
        try {
          ${code}
        } catch(e) {
          window.parent.postMessage({ type: "error", msg: e && e.message || String(e) }, "*");
        }
      <\/script>`;
    }
  }

  // PUBLIC_INTERFACE
  function handleReset() {
    setCode(DEFAULT_SNIPPET);
    setOutput('');
    setError(null);
    setExecuting(false);
  }

  // Receive console.log output & errors from iframe
  React.useEffect(() => {
    function handleMessage(e) {
      if (e.data && typeof e.data === "object") {
        if (e.data.type === "log") {
          setOutput((prev) => prev + (prev ? '\n' : '') + e.data.msg);
          setExecuting(false);
        } else if (e.data.type === "error") {
          setError(e.data.msg);
          setExecuting(false);
        }
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // PUBLIC_INTERFACE
  function handleCodeChange(e) {
    setCode(e.target.value);
    setOutput('');
    setError(null);
  }

  // Minimal JS syntax highlighting for textarea (for demo; not full-featured)
  function highlightJS(code) {
    // Very simple regex-based highlighting (not robust)
    let html = code
      .replace(/(\/\/.*)/g, `<span class="token-comment">$1</span>`)
      .replace(/(".*?"|'.*?'|`.*?`)/g, `<span class="token-string">$1</span>`)
      .replace(/\b(function|return|if|else|var|let|const|console|log|for|while|try|catch|window|document|new)\b/g,
        `<span class="token-keyword">$1</span>`);
    return html.replace(/\n/g, '<br/>');
  }

  return (
    <div className="playground-root">
      <header className="playground-header">
        <h1 className="project-title">
          <span style={{ color: COLORS.accent }}>JS</span>
          <span style={{ color: COLORS.primary }}>Play</span>
          <span style={{ color: COLORS.secondary }}>ground</span>
        </h1>
        <div className="controls">
          <button
            className="run-btn"
            onClick={handleRun}
            disabled={executing}
            tabIndex={0}
          >{executing ? 'Running...' : 'Run ▶'}</button>
          <button
            className="reset-btn"
            onClick={handleReset}
            tabIndex={0}
          >Reset ⟳</button>
        </div>
      </header>
      <main className="split-view">
        <section className="editor-section">
          <label className="editor-label" htmlFor="editor">JavaScript Code</label>
          <div className="editor-area">
            <pre
              className="editor-highlight"
              aria-hidden="true"
              dangerouslySetInnerHTML={{ __html: highlightJS(code) + '<br/>' }}
            />
            <textarea
              id="editor"
              value={code}
              onChange={handleCodeChange}
              spellCheck={false}
              autoComplete="off"
              className="editor-textarea"
              aria-label="JavaScript code editor"
            />
          </div>
        </section>
        <section className="output-section">
          <label className="output-label">Output Console</label>
          <div className="output-area">
            {error ?
              <pre className="output-error">{error}</pre>
              :
              <pre className="output-result">{output || ' '}</pre>
            }
          </div>
        </section>
        <iframe
          ref={iframeRef}
          sandbox="allow-scripts"
          style={{ display: 'none' }}
          title="js-playground-sandbox"
        />
      </main>
    </div>
  );
}

export default App;
