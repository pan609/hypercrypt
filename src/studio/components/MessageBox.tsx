import { useState } from 'react';
import { Play, X } from 'lucide-react';
import { useStudio } from '../store/useStudioStore';

const QUICK_COMMANDS = ['play "chime"', 'go to next card', 'answer "Hello from 1987!" with "Nice!"'];

export function MessageBox() {
  const { messageBoxOpen, setMessageBoxOpen, runMessageBoxCommand } = useStudio();
  const [command, setCommand] = useState('play "chime"');

  if (!messageBoxOpen) return null;

  const submit = () => {
    if (!command.trim()) return;
    void runMessageBoxCommand(command);
  };

  return (
    <div className="hc-msgbox" role="region" aria-label="HyperTalk Message Box">
      <strong>Msg &gt;</strong>
      <input
        aria-label="HyperTalk command"
        data-testid="msgbox-input"
        className="hc-input"
        style={{ flex: 1, fontSize: 12 }}
        value={command}
        placeholder='Type any HyperTalk command, e.g. go to card 2 or play "chime"'
        onChange={(e) => setCommand(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
          if (e.key === 'Escape') setMessageBoxOpen(false);
        }}
      />
      <button type="button" className="hc-btn primary" onClick={submit}>
        <Play size={12} /> Run
      </button>

      {QUICK_COMMANDS.map((cmd) => (
        <button
          key={cmd}
          type="button"
          className="hc-btn"
          style={{ fontSize: 10 }}
          onClick={() => {
            setCommand(cmd);
            void runMessageBoxCommand(cmd);
          }}
        >
          {cmd}
        </button>
      ))}

      <button type="button" className="hc-btn" aria-label="Close message box" onClick={() => setMessageBoxOpen(false)}>
        <X size={12} />
      </button>
    </div>
  );
}
