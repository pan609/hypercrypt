import { CardFilmstrip } from './studio/components/CardFilmstrip';
import { CardStage } from './studio/components/CardStage';
import { DitherModal } from './studio/components/DitherModal';
import { InspectorDrawer } from './studio/components/InspectorDrawer';
import { MenuBar } from './studio/components/MenuBar';
import { MessageBox } from './studio/components/MessageBox';
import { ToolPalette } from './studio/components/ToolPalette';
import { StudioProvider, useStudio } from './studio/store/useStudioStore';
import './studio/styles/themes.css';

function StudioShell() {
  const { mode, theme, toast } = useStudio();

  return (
    <div className="hc-app" data-hc-theme={theme} data-hc-mode={mode}>
      <MenuBar />
      <div className="hc-workspace">
        {mode === 'author' && <ToolPalette />}
        <CardStage />
        {mode === 'author' && <InspectorDrawer />}
      </div>
      {mode === 'author' && <CardFilmstrip />}
      <MessageBox />
      <DitherModal />
      {toast && (
        <div className="hc-toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </div>
  );
}

export function App() {
  return (
    <StudioProvider>
      <StudioShell />
    </StudioProvider>
  );
}

export default App;
