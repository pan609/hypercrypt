# Tasks — `hypertalk-engine`

- [x] 1. Define canonical data schemas and AST/Host interfaces in `src/engine/types.ts`
- [x] 2. Implement HyperTalk Lexer (`src/engine/lexer.ts`) with 1-based line/column tracking and `--` comments
- [x] 3. Implement Recursive-Descent Parser (`src/engine/parser.ts`) supporting handlers, `if/else`, `repeat`, containers, visual effects, and single-line Message Box commands
- [x] 4. Implement Sandboxed Async Interpreter (`src/engine/interpreter.ts`) with `global` persistence, `it` variable, 10,000-step budget, call-depth limit, tracing, and Step Mode hook
- [x] 5. Implement Static Stack Validator (`src/engine/validator.ts`) checking script syntax and broken `go to card` targets
- [x] 6. Implement 512×342 1-Bit Bitmap RLE codec + paint primitives (`src/engine/bitmap.ts`) and Bill Atkinson dithering (`src/engine/atkinson.ts`)
- [x] 7. Write comprehensive Vitest unit suite (`tests/unit/engine.test.ts`, `tests/unit/bitmap-atkinson.test.ts`) covering all grammar rules, error diagnostics, and infinite-loop protection
