import { ArrowLeft, ArrowRight, Copy, Plus, Trash2 } from 'lucide-react';
import { useStudio } from '../store/useStudioStore';

export function CardFilmstrip() {
  const {
    stack,
    t,
    activeCardIndex,
    goToCard,
    addCard,
    duplicateCard,
    deleteCard,
    moveCard,
  } = useStudio();

  return (
    <section className="hc-filmstrip" aria-label="Card filmstrip">
      {stack.cards.map((card, idx) => (
        <button
          key={card.id}
          type="button"
          className={`hc-thumb ${idx === activeCardIndex ? 'active' : ''}`}
          onClick={() => goToCard(idx)}
        >
          <span>
            {idx + 1}. {card.name}
          </span>
          <span style={{ fontSize: 9, opacity: 0.75 }}>{t.objCount(card.objects.length)}</span>
        </button>
      ))}

      <button type="button" className="hc-btn primary" onClick={addCard}>
        <Plus size={12} /> {t.addCard}
      </button>
      <button type="button" className="hc-btn" title="Duplicate active card" onClick={duplicateCard}>
        <Copy size={12} /> {t.dupCard}
      </button>
      <button
        type="button"
        className="hc-btn"
        title="Move card left"
        disabled={activeCardIndex === 0}
        onClick={() => moveCard(activeCardIndex, -1)}
      >
        <ArrowLeft size={12} />
      </button>
      <button
        type="button"
        className="hc-btn"
        title="Move card right"
        disabled={activeCardIndex >= stack.cards.length - 1}
        onClick={() => moveCard(activeCardIndex, 1)}
      >
        <ArrowRight size={12} />
      </button>
      <button
        type="button"
        className="hc-btn danger"
        title="Delete active card"
        disabled={stack.cards.length <= 1}
        onClick={() => deleteCard(activeCardIndex)}
      >
        <Trash2 size={12} />
      </button>
    </section>
  );
}
