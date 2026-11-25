# Requirements — `hypertalk-engine`

## Overview
Build a pure-TypeScript, zero-DOM, zero-`eval` HyperTalk v1.0 Lexer, Parser, Sandboxed Async Interpreter, Static Stack Validator, and 1-bit Bitmap/Atkinson Dithering engine shared across the web Studio, exported standalone HTML runtime, and `hypercrypt-mcp`.

## Requirements (EARS Notation)

### REQ-1: Lexical Analysis & Parsing
- **REQ-1.1**: WHEN a user or tool submits HyperTalk source code, THE SYSTEM SHALL tokenize keywords, identifiers, numbers, double-quoted strings, operators, newlines, and `--` comments while preserving 1-based line and column offsets.
- **REQ-1.2**: WHEN valid HyperTalk handlers (`on <name> ... end <name>`) or single-line Message Box statements are parsed, THE SYSTEM SHALL produce a strongly-typed AST with zero runtime `eval`.
- **REQ-1.3**: IF HyperTalk source contains a syntax error (such as mismatched `end if`, unterminated string, or invalid command), THEN THE SYSTEM SHALL return structured `ParseError` diagnostics containing `line`, `column`, and an actionable message without throwing uncaught exceptions.

### REQ-2: Sandboxed Async Execution
- **REQ-2.1**: WHEN an event handler (e.g., `mouseUp`, `openCard`, `closeCard`) is triggered on a card or object, THE SYSTEM SHALL execute the matching handler asynchronously through a Host Adapter interface (navigation, dialogs, audio, field/button mutation, wait).
- **REQ-2.2**: WHEN a script declares `global <var>`, THE SYSTEM SHALL read and persist that variable across cards and handlers within the active Stack session.
- **REQ-2.3**: WHEN a script executes `ask` or `answer`, THE SYSTEM SHALL await the host dialog response and store the returned value in the built-in `it` variable.
- **REQ-2.4**: IF a script exceeds 10,000 AST execution steps OR exceeds call-stack depth 32, THEN THE SYSTEM SHALL abort immediately with a descriptive `SandboxLimitError` so the host process never freezes.

### REQ-3: Live Step Debugging & Execution Trace
- **REQ-3.1**: WHEN execution runs with tracing enabled, THE SYSTEM SHALL emit ordered `TraceEntry` events containing line number, statement summary, and variable snapshot.
- **REQ-3.2**: WHEN execution runs in Step Mode, THE SYSTEM SHALL pause before each statement via an async step gate callback until the caller clicks Step or Continue.

### REQ-4: Whole-Stack Static Validation
- **REQ-4.1**: WHEN `validateStack(stack)` is invoked, THE SYSTEM SHALL validate schema version, non-empty unique card IDs, syntax of all stack/card/object scripts, and detect broken `go to card "<name>"` or out-of-range numeric card references.

### REQ-5: 1-Bit Bitmap & Bill Atkinson Dithering
- **REQ-5.1**: WHEN a 512×342 1-bit bitmap (`Uint8Array` of 0/1) is encoded to RLE and decoded back, THE SYSTEM SHALL preserve every bit losslessly.
- **REQ-5.2**: WHEN an RGBA image buffer is processed with `atkinsonDither`, THE SYSTEM SHALL distribute 6/8 of quantization error across the 6 classic Atkinson neighbor offsets (`+1,0`, `+2,0`, `-1,+1`, `0,+1`, `+1,+1`, `0,+2`) and output a deterministic 1-bit `Uint8Array`.
