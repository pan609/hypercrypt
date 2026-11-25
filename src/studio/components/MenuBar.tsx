import { useRef, useState } from 'react';
import { Download, FileJson, FolderOpen, Link2, Plus, RotateCcw, Terminal, Volume2, VolumeX } from 'lucide-react';
import { BUILTIN_PRESETS } from '../../presets';
import { useStudio } from '../store/useStudioStore';

export function MenuBar() {
  const {
    stack,
    mode,
    theme,
    muted,
    messageBoxOpen,
    setMode,
    setTheme,
    toggleMute,
    setMessageBoxOpen,
    loadPreset,
    newBlankStack,
    resetActivePreset,
    importStackJson,
    exportHtmlFile,
    exportJsonFile,
    copyShareLink,
  } = useStudio();

  const [stacksMenuOpen, setStacksMenuOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        importStackJson(reader.result);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
    setStacksMenuOpen(false);
  };

  return (
    <header className="hc-menubar" role="banner">
      <div className="hc-menubar-left">
        <span className="hc-logo-badge" aria-hidden="true">
          HC
        </span>
        <span>HyperCrypt</span>

        {/* Stack Switcher Dropdown */}
        <div className="hc-dropdown-wrap">
          <button
            type="button"
            className="hc-btn"
            aria-expanded={stacksMenuOpen}
            onClick={() => {
              setStacksMenuOpen((o) => !o);
              setExportMenuOpen(false);
            }}
          >
            Stack: {stack.title} ▾
          </button>

          {stacksMenuOpen && (
            <div className="hc-dropdown-menu" role="menu">
              {BUILTIN_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  role="menuitem"
                  className="hc-dropdown-item"
                  onClick={() => {
                    loadPreset(preset.id);
                    setStacksMenuOpen(false);
                  }}
                >
                  <strong>{preset.label}</strong>
                  <small>{preset.tagline}</small>
                </button>
              ))}
              <div className="hc-dropdown-divider" />
              <button
                type="button"
                role="menuitem"
                className="hc-dropdown-item"
                onClick={() => {
                  newBlankStack();
                  setStacksMenuOpen(false);
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Plus size={13} /> New Blank Stack
                </span>
              </button>
              <button
                type="button"
                role="menuitem"
                className="hc-dropdown-item"
                onClick={() => {
                  resetActivePreset();
                  setStacksMenuOpen(false);
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <RotateCcw size={13} /> Reset Current Demo
                </span>
              </button>
              <button
                type="button"
                role="menuitem"
                className="hc-dropdown-item"
                onClick={() => fileInputRef.current?.click()}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FolderOpen size={13} /> Open .hcstack.json...
                </span>
              </button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.hcstack.json"
            style={{ display: 'none' }}
            onChange={handleFileImport}
          />
        </div>
      </div>

      <div className="hc-menubar-right">
        {/* Mode Switcher */}
        <div className="hc-seg" role="group" aria-label="Studio mode">
          <button type="button" className={mode === 'browse' ? 'active' : ''} onClick={() => setMode('browse')}>
            Browse
          </button>
          <button type="button" className={mode === 'author' ? 'active' : ''} onClick={() => setMode('author')}>
            Author
          </button>
        </div>

        {/* Dual Skin Switcher */}
        <div className="hc-seg" role="group" aria-label="Visual skin">
          <button type="button" className={theme === 'classic' ? 'active' : ''} onClick={() => setTheme('classic')}>
            1987 Cream
          </button>
          <button type="button" className={theme === 'kiroween' ? 'active' : ''} onClick={() => setTheme('kiroween')}>
            Kiroween Dusk
          </button>
        </div>

        <button
          type="button"
          className={`hc-btn ${messageBoxOpen ? 'primary' : ''}`}
          title="Toggle Message Box (Cmd/Ctrl+M)"
          onClick={() => setMessageBoxOpen(!messageBoxOpen)}
        >
          <Terminal size={13} /> ⌘M Msg
        </button>

        <button
          type="button"
          className="hc-btn"
          aria-label={muted ? 'Unmute audio' : 'Mute audio'}
          title={muted ? 'Unmute Web Audio' : 'Mute Web Audio'}
          onClick={toggleMute}
        >
          {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
        </button>

        {/* Export Dropdown */}
        <div className="hc-dropdown-wrap">
          <button
            type="button"
            className="hc-btn primary"
            aria-expanded={exportMenuOpen}
            onClick={() => {
              setExportMenuOpen((o) => !o);
              setStacksMenuOpen(false);
            }}
          >
            <Download size={13} /> Export ▾
          </button>

          {exportMenuOpen && (
            <div className="hc-dropdown-menu align-right" role="menu">
              <button
                type="button"
                role="menuitem"
                className="hc-dropdown-item"
                onClick={() => {
                  exportHtmlFile();
                  setExportMenuOpen(false);
                }}
              >
                <strong style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Download size={13} /> Export Single-File .html
                </strong>
                <small>Offline playable file with embedded HyperTalk engine</small>
              </button>
              <button
                type="button"
                role="menuitem"
                className="hc-dropdown-item"
                onClick={() => {
                  void copyShareLink();
                  setExportMenuOpen(false);
                }}
              >
                <strong style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Link2 size={13} /> Copy Share Link
                </strong>
                <small>Encodes stack into #stack= URL hash</small>
              </button>
              <button
                type="button"
                role="menuitem"
                className="hc-dropdown-item"
                onClick={() => {
                  exportJsonFile();
                  setExportMenuOpen(false);
                }}
              >
                <strong style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FileJson size={13} /> Download .hcstack.json
                </strong>
                <small>Clean JSON format compatible with hypercrypt-mcp</small>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
