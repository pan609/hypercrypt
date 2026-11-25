# Tasks — `stack-studio`

- [x] 1. Scaffold Vite + React + TypeScript + Vitest + Playwright project configuration and dual-skin CSS theme system (`src/studio/styles/themes.css`)
- [x] 2. Implement procedural Web Audio retro synthesizer (`src/studio/audio/retroAudio.ts`)
- [x] 3. Implement central Studio state store with undo/redo, localStorage persistence, and RuntimeHost bridge (`src/studio/store/useStudioStore.tsx`)
- [x] 4. Build core workstation chrome: `MenuBar.tsx`, `CardStage.tsx` (transitions + `ask`/`answer` modals), `BitmapCanvas.tsx` (1-bit display + paint tools), and `MessageBox.tsx`
- [x] 5. Build Author Mode panels: `ToolPalette.tsx`, `InspectorDrawer.tsx` (Script Editor + Live Step Debugger + Object Props), `CardFilmstrip.tsx`, and `DitherModal.tsx` (Atkinson photo importer)
- [x] 6. Author the 3 flagship built-in stacks (`atticMac1987.ts`, `prodRunbook502.ts`, `atkinsonLab.ts`) with charming procedural Atkinson 1-bit illustrations and pass `npm run validate:presets`
- [x] 7. Write React Testing Library integration tests (`tests/integration/studio.test.tsx`) verifying Browse play, Author edit/undo, skin switching, and Message Box
