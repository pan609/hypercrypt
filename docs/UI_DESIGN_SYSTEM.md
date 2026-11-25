# HyperCrypt — Stage 2: UI/UX Design System & Interaction Spec

> **Status**: Ready for Gate 2 Review (Rev 2 — Warm 1987 Cream × Playful Kiroween Dusk)  
> **Companion Visual Prototype**: `docs/ui-mockup.html` (rendered inline for live inspection)  
> **Target Aesthetic**: Warm, friendly 1987 Macintosh System 6 craftsmanship × Playful Kiro-violet Halloween charm — **bright, nostalgic, tactile, zero grim horror**.

---

## 1. Visual Direction & Emotional Signature

When a judge opens `hypercrypt.vercel.app`, the first impression within 1 second should be:
> *"Oh this is delightful! It feels like a lovingly restored 1987 Macintosh HyperCard studio on warm archival paper — and flipping to Kiroween Dusk turns it into a cozy violet-and-pumpkin retro console!"*

### Core Principles
1. **The Card Is the Hero**: Every pixel of chrome serves the central **512 × 342** Macintosh Card stage (the exact native resolution of the original 1984–1987 9-inch compact Macintosh & HyperCard!).
2. **Progressive Disclosure (Browse vs. Author)**:
   - **Browse Mode (Landing State)**: Clean desktop canvas + classic top menu bar + centered Macintosh card window + subtle bottom card navigation pill (`Card 1 of 6` + `Peek Script`). Zero visual noise so the judge immediately clicks the card and plays.
   - **Author Mode (Studio State)**: Smoothly reveals the **Left Tool Palette** (Pointer, Button, Field, Pencil, Line, Rect, Bucket, Eraser, Pattern Picker, Atkinson Image Importer), **Right Inspector & HyperTalk Debugger Drawer** (Properties / Script / Debugger tabs), and **Bottom Card Filmstrip**.
3. **Pixel-Honest Craft**: Crisp `image-rendering: pixelated` on the 512×342 1-bit bitmap canvas, authentic horizontal pinstripe window title bars, offset hard drop shadows (`2px 2px 0`), and authentic Macintosh alert modals for `ask` / `answer`.

---

## 2. Dual-Skin Token System

Both skins share identical layout geometry and interactive affordances—only semantic CSS custom properties (`data-theme="classic"` vs `data-theme="haunted"`) and optional CRT overlay effects switch:

| Token | `classic` (1987 Warm Cream) | `kiroween` (Kiroween Dusk — Violet & Pumpkin) | Usage |
| :--- | :--- | :--- | :--- |
| `--hc-desk-bg` | `#E6E0D2` + soft warm dot pattern | `#161126` + subtle star-violet grid | Outer workstation desktop pattern |
| `--hc-surface` | `#FBF8F1` (warm ivory paper) | `#211A38` (cozy twilight indigo) | Card window, panels, modals |
| `--hc-surface-alt` | `#F1ECE0` | `#2B2248` | Tool palettes, inspector headers |
| `--hc-ink` | `#221F1B` (warm charcoal) | `#F2ECFF` (soft moonlight white) | Primary text, 1-bit foreground pixels, borders |
| `--hc-ink-muted` | `#6E675B` | `#A99BCE` | Secondary labels, line numbers |
| `--hc-accent` | `#D96B27` (warm vintage amber) | `#FF9E44` (playful pumpkin orange) | Active tool, selected object, debugger step line |
| `--hc-border` | `#2E2923` (`1.5px` / `2px` crisp) | `#A78BFA` (Kiro signature violet) | All window frames & controls |
| `--hc-shadow` | `3px 3px 0 rgba(46,41,35,0.85)` | `0 0 22px rgba(167,139,250,0.22), 3px 3px 0 #0B0816` | Tactile retro depth |
| `--hc-danger` | `#C0392B` | `#FF6B8A` | Syntax errors, destructive actions |
| `--hc-crt-scanline` | `none` | Ultra-subtle soft violet glow & faint retro lines | Cozy dusk atmosphere (pointer-events: none) |

> **Important 1-Bit Bitmap Rule**: The card's 1-bit paint layer stores pure boolean bits (`0` = paper, `1` = ink). Switching between **1987 Cream** and **Kiroween Dusk** dynamically re-renders every 1-bit dithered drawing from warm charcoal-on-cream (`#221F1B` on `#FBF8F1`) to crisp moonlight-violet (`#EDE6FF` on `#1B1530`)!

---

## 3. Typography System (Offline-Safe)

To guarantee both authentic retro character AND zero broken fonts in exported single-file `.html` files:
- **Display / Window Titles / Classic Buttons**: `'Silkscreen'`, `'ChicagoFLF'`, `'Geneva'`, `ui-monospace`, `'SF Mono'`, system crisp sans fallback (`letter-spacing: 0.02em`, `font-weight: 700`).
- **Card Body & Fields**: Clean readable pixel-friendly sans / slab (`'IBM Plex Mono'`, `'SF Mono'`, `'Menlo'`, monospace for code/retro feel; clean readable sans option for runbooks).
- **HyperTalk Script Editor & Debugger**: `'JetBrains Mono'`, `'SF Mono'`, `'Menlo'`, `monospace` at `12.5px` / `1.55` line-height with crisp syntax token coloring:
  - Keywords (`on`, `end`, `if`, `then`, `else`, `repeat`, `go`, `to`, `put`, `into`, `global`, `visual`, `effect`, `play`, `ask`, `answer`) → Bold Accent
  - Strings (`"Vault"`, `"1987"`) → Distinct Contrast Tone
  - Numbers → Highlight Tone
  - Comments (`-- ...`) → Muted Italic

---

## 4. Workstation Layout Architecture

```
+------------------------------------------------------------------------------+
| [] HyperCrypt  [Stack: The Crypt of 1987 ▾]  [Browse | Author]  [1987|CRT]  |  <- 36px Classic Menu Bar
|                                                [Cmd+M Msg]  [Export ▾]       |
+------------+----------------------------------------+------------------------+
|            |  ====================================  |  [Props|Script|Debug]  |
|  TOOLS     |  [■]  The Crypt of 1987 — Card 1/6     |  --------------------  |
| (Author    |  ====================================  |  Target: btn "Enter"   |
|  Mode      |  +----------------------------------+  |  on mouseUp            |
|  Only)     |  |                                  |  |    play "unlock"       |
|            |  |   512 × 342 Crisp 1-Bit Canvas   |  |    visual effect       |
| [↖] Select |  |   + Interactive Buttons & Fields |  |      dissolve          |
| [▢] Button |  |                                  |  |    go to next card     |
| [T] Field  |  |                                  |  |  end mouseUp           |
| --------   |  +----------------------------------+  |  --------------------  |
| [✎] Pencil |                                        |  Watch: keys = 0       |
| [/] Line   |    [< Prev]  Card 1 / 6  [Next >]      |  Trace: Ready          |
| [□] Rect   |    [Peek Script]  [Reset Stack]        |                        |
| [❖] Fill   |                                        +------------------------+
| [⌫] Erase  |  +------------------------------------------------------------+ |
| [▤] Dither |  | Card Filmstrip (Author Mode): [1] [2] [3] [4] [5] [6] [+]  | |
+------------+--+------------------------------------------------------------+-+
                 [ Floating Message Box (Cmd+M): > play "spooky"          ↵ ]
```

### Responsive Scaling Strategy
- The logical card coordinate space is always **512 × 342** (classic 3:2 Macintosh aspect ratio) so card layouts, coordinates, and 1-bit pixel drawings are 100% deterministic across every screen and in exported HTML files.
- Inside the viewport, the stage applies an integer or smooth CSS scale (`transform: scale(...)` or crisp container scaling) so the card looks sharp and generous on 1280px, 1440px, and 1920px displays without clipping.

---

## 5. Component Specifications

### 5.1 Card Control Types (Objects)
1. **Classic Rounded Button (`roundrect`)**: `1.5px` solid border, `6px` radius, crisp centered label, invert colors on `:active` press (authentic Mac click inversion!).
2. **Shadow Button (`shadow`)**: Sharp rectangle with `2px 2px 0` solid drop shadow, presses down `1px` on click.
3. **Transparent Hotspot (`transparent`)**: Completely invisible in **Browse Mode** (cursor becomes pointer over pixel art secrets!); in **Author Mode** renders with a subtle dashed marching border + badge label so authors can position it over dithered art.
4. **Checkbox (`checkbox`)**: Classic square box with crisp `X` tick, readable/writable via HyperTalk.
5. **Text Field (`rectangle` / `scrolling` / `transparent`)**: Supports locked (read-only display) or editable user input; scriptable via `put ... into field "Name"`.

### 5.2 Classic Modal Dialogs (`answer` & `ask`)
- Authentic Macintosh double-bordered modal box centered over the card stage with subtle dim backdrop.
- Default button gets the iconic **thick double outer ring** (`3px` outer frame around the primary button) and responds to `Enter` / `Escape`.

### 5.3 Atkinson Dithering Import Dialog
- Triggered by dropping an image onto the card or clicking the **Dither Import** tool in Author Mode.
- Shows a side-by-side live preview (Original vs. **Bill Atkinson 1-Bit Dither** at 512×342) with:
  - Brightness / Contrast sliders
  - Fit mode (`Cover`, `Contain`, `Stamp Center`)
  - Algorithm toggle (`Atkinson 1987` default vs. `Threshold` comparison so users immediately appreciate why Atkinson dithering looks magical!)

### 5.4 Visual Effects & Web Audio Sound Map
| Visual Effect (`visual effect ...`) | CSS/Canvas Animation (`320ms`) |
| :--- | :--- |
| `dissolve` | Authentic pixelated checkerboard / stepped opacity dissolve |
| `wipe left` / `wipe right` | Hard-edge horizontal clip-path curtain wipe |
| `iris open` | Expanding rectangular iris clip from card center |
| `barn door open` | Vertical split opening outward from center |

| Sound (`play "..."`) | Web Audio Procedural Synthesis |
| :--- | :--- |
| `click` | Short 12ms crisp square-wave click |
| `beep` | Classic Macintosh 1987 Sosumi-inspired 880Hz square/triangle chime |
| `chime` | Warm 3-note arpeggio (C5-E5-G5) |
| `unlock` | Mechanical double-latch + rising fifth |
| `organ` / `spooky` | Minor diminished chord with gentle vibrato (extra detuned in Haunted CRT!) |
| `error` | Low 160Hz double buzz |

---

## 6. Keyboard Shortcuts
- `Cmd/Ctrl + B`: Toggle **Browse / Author** mode
- `Cmd/Ctrl + M`: Toggle classic **Message Box**
- `Cmd/Ctrl + Shift + H`: Toggle **Classic 1987 ↔ Haunted CRT** skin
- `Left / Right Arrow` (when not typing in a field): Navigate Prev / Next card
- `Cmd/Ctrl + Z` / `Cmd/Ctrl + Shift + Z`: Undo / Redo paint & object edits in Author Mode
- `Cmd/Ctrl + S`: Save & show subtle "Saved to local stack" confirmation
