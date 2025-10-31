interface SummaryCard {
  label: string;
  value: string;
  icon: string;
  helper: string;
}

interface PlayerSummarySectionProps {
  cards: SummaryCard[];
}

export default function PlayerSummarySection({ cards }: PlayerSummarySectionProps) {
  if (!cards.length) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Resumen global del servidor</h2>
      <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="flex items-start gap-3 border-b border-gray-800/60 pb-3 last:border-b-0">
            <img src={card.icon} alt="" className="mt-1 h-7 w-7 flex-shrink-0 object-contain" />
            <div className="space-y-1">
              <dt className="text-[11px] uppercase tracking-wider text-gray-500">{card.label}</dt>
              <dd className="text-lg font-semibold text-white">{card.value}</dd>
              <p className="text-xs text-gray-500">{card.helper}</p>
            </div>
          </div>
        ))}
      </dl>
    </section>
  );
}


