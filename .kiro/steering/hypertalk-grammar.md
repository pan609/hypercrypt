---
inclusion: fileMatch
fileMatchPattern: "src/engine/**"
---

# HyperTalk Grammar & Runtime Specification Steering

When modifying any file in `src/engine/`, strictly preserve compatibility with the HyperTalk v1.0 EBNF subset:

## Lexical Rules
- Case-insensitive keywords & identifiers (`on mouseUp`, `ON MOUSEUP`, `On MouseUp` are equivalent).
- Line comments start with `--` and run to end of line.
- Double-quoted string literals `"..."` with `\"` and `\n` escape support.
- Numeric literals: integers and decimals (`1987`, `3.14`).

## Supported Statements
- Handler definition: `on <name> [param1, param2, ...] <block> end <name>`
- Global declaration: `global <ident> [, <ident> ...]`
- Assignment / Container mutation:
  - `put <expr> into <var | field <expr>>`
  - `put <expr> before <var | field <expr>>`
  - `put <expr> after <var | field <expr>>`
- Arithmetic mutations:
  - `add <expr> to <container>`
  - `subtract <expr> from <container>`
  - `multiply <container> by <expr>`
  - `divide <container> by <expr>`
- Navigation & Visual Effects:
  - `visual effect (dissolve | wipe left | wipe right | iris open | barn door open)`
  - `go [to] (next | prev | previous | first | last) card`
  - `go [to] card <expr>` (string name or 1-based integer index)
- Visibility & Properties:
  - `(show | hide) (button | field) <expr>`
  - `set [the] (label | text | checked) of (button | field) <expr> to <expr>`
- Dialogs, Audio & Timing:
  - `answer <expr> [with <expr> [or <expr>]]` (stores chosen button label in `it`)
  - `ask <expr> [with <expr>]` (stores user input in `it`, or empty on cancel)
  - `play <expr>`
  - `wait <expr> (milliseconds | millisecond | ms | seconds | second)`
- Control Flow:
  - `if <expr> then <single-stmt>`
  - `if <expr> then <block> [else if <expr> then <block>]* [else <block>] end if`
  - `repeat <expr> times <block> end repeat`
  - `repeat with <ident> = <expr> to <expr> <block> end repeat`
  - `repeat while <expr> <block> end repeat`
  - `exit repeat` / `exit <handlerName>` / `return <expr>`
- Built-in Expressions & Constants:
  - `empty` (`""`), `space` (`" "`), `return` (`"\n"`), `quote` (`"\""`), `true`, `false`, `it`
  - `the number of cards`, `the name of this card`, `the text of field <expr>`, `the label of button <expr>`, `the checked of button <expr>`
  - Operators (lowest to highest): `or` → `and` → `not` → `= <> != is "is not" < <= > >= contains` → `& &&` → `+ -` → `* / mod` → unary `-`

## Diagnostic Quality
- Every `ParseError` MUST include 1-based `line`, `column`, and an actionable human-readable message.
- Every runtime error MUST include the statement `line` and active handler name.
