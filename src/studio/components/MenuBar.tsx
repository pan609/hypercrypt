import { useRef, useState } from 'react';
import { Download, FileJson, FolderOpen, Languages, Link2, Plus, RotateCcw, Terminal, Volume2, VolumeX } from 'lucide-react';
import { BUILTIN_PRESETS } from '../../presets';
import { useStudio } from '../store/useStudioStore';

export function MenuBar() {
  const {
    stack,
    mode,
    theme,
    locale,
    t,
    muted,
    messageBoxOpen,
    setMode,
    setTheme,
    setLocale,
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
            {t.stackPrefix}: {stack.title} ▾
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
                  <strong>{preset.label[locale]}</strong>
                  <small>{preset.tagline[locale]}</small>
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
                  <Plus size={13} /> {t.newBlankStack}
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
                  <RotateCcw size={13} /> {t.resetDemo}
                </span>
              </button>
              <button
                type="button"
                role="menuitem"
                className="hc-dropdown-item"
                onClick={() => fileInputRef.current?.click()}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FolderOpen size={13} /> {t.openJson}
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
            {t.browse}
          </button>
          <button type="button" className={mode === 'author' ? 'active' : ''} onClick={() => setMode('author')}>
            {t.author}
          </button>
        </div>

        {/* Dual Skin Switcher */}
        <div className="hc-seg" role="group" aria-label="Visual skin">
          <button type="button" className={theme === 'classic' ? 'active' : ''} onClick={() => setTheme('classic')}>
            {t.skinClassic}
          </button>
          <button type="button" className={theme === 'kiroween' ? 'active' : ''} onClick={() => setTheme('kiroween')}>
            {t.skinKiroween}
          </button>
        </div>

        {/* Bilingual EN / 中文 Toggle */}
        <button
          type="button"
          className="hc-btn"
          aria-label="Switch language"
          title={locale === 'en' ? '切换为中文' : 'Switch to English'}
          onClick={() => setLocale(locale === 'en' ? 'zh' : 'en')}
        >
          <Languages size={13} /> {locale === 'en' ? '中文' : 'EN'}
        </button>

        <button
          type="button"
          className={`hc-btn ${messageBoxOpen ? 'primary' : ''}`}
          title="Toggle Message Box (Cmd/Ctrl+M)"
          onClick={() => setMessageBoxOpen(!messageBoxOpen)}
        >
          <Terminal size={13} /> {t.msgBtn}
        </button>

        <button
          type="button"
          className="hc-btn"
          aria-label={muted ? t.unmuteAudio : t.muteAudio}
          title={muted ? t.unmuteAudio : t.muteAudio}
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
            <Download size={13} /> {t.exportBtn} ▾
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
                  <Download size={13} /> {t.exportHtmlTitle}
                </strong>
                <small>{t.exportHtmlDesc}</small>
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
                  <Link2 size={13} /> {t.shareLinkTitle}
                </strong>
                <small>{t.shareLinkDesc}</small>
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
                  <FileJson size={13} /> {t.exportJsonTitle}
                </strong>
                <small>{t.exportJsonDesc}</small>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
