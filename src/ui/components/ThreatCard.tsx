import { useState } from "react";
import type { Threat } from "../../domain/model";
import { CategoryBadge, PriorityBadge, StateBadge } from "./Badge";

export interface ThreatCardProps {
  threat: Threat;
  selected?: boolean;
  onSelect?: (threat: Threat) => void;
}

export function ThreatCard({ threat, selected, onSelect }: ThreatCardProps) {
  const [expanded, setExpanded] = useState(false);

  const onCardClick = () => {
    onSelect?.(threat);
  };

  return (
    <article
      data-testid={`threat-card-${threat.id}`}
      data-selected={selected ? "true" : "false"}
      onClick={onCardClick}
      className={
        "cursor-pointer rounded-md border bg-white p-3 shadow-sm transition-colors dark:bg-slate-900 " +
        (selected
          ? "border-blue-500 ring-1 ring-blue-300"
          : "border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700")
      }
    >
      <header className="flex items-start gap-2">
        <PriorityBadge priority={threat.priority} />
        <CategoryBadge category={threat.category} />
        <StateBadge state={threat.state} />
        <span className="ml-auto text-xs text-slate-400">#{threat.id}</span>
      </header>
      <h3 className="mt-2 text-sm font-semibold leading-snug">
        {threat.title}
      </h3>
      {threat.shortDescription && (
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
          {threat.shortDescription}
        </p>
      )}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setExpanded((v) => !v);
        }}
        className="mt-2 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
        aria-expanded={expanded}
        data-testid={`threat-card-toggle-${threat.id}`}
      >
        {expanded ? "Hide details" : "Show details"}
      </button>
      {expanded && (
        <div
          className="mt-2 space-y-2 border-t border-slate-200 pt-2 text-xs dark:border-slate-800"
          data-testid={`threat-card-details-${threat.id}`}
        >
          {threat.description && (
            <section>
              <h4 className="font-medium">Description</h4>
              <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                {threat.description}
              </p>
            </section>
          )}
          {threat.possibleMitigations && (
            <section>
              <h4 className="font-medium">Possible mitigations</h4>
              <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                {threat.possibleMitigations}
              </p>
            </section>
          )}
          {threat.sdlPhase && (
            <section>
              <h4 className="font-medium">SDL phase</h4>
              <p className="text-slate-700 dark:text-slate-300">{threat.sdlPhase}</p>
            </section>
          )}
        </div>
      )}
    </article>
  );
}
