import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Event } from '@/types/vehicle';
import { EventCard } from './EventCard';
import { BlockchainIndicator } from './VerificationBadge';

interface EventTimelineProps {
  events: Event[];
  isCertified: (event: Event) => boolean;
}

interface EventGroup {
  year: number;
  events: Event[];
}

export function EventTimeline({ events, isCertified }: EventTimelineProps) {
  const { t } = useTranslation('vehicle');

  const groupedEvents = useMemo(() => {
    const groups: EventGroup[] = [];
    let currentYear: number | null = null;
    let currentGroup: EventGroup | null = null;

    for (const event of events) {
      const eventYear = new Date(event.date).getFullYear();

      if (eventYear !== currentYear) {
        if (currentGroup) {
          groups.push(currentGroup);
        }
        currentYear = eventYear;
        currentGroup = { year: eventYear, events: [event] };
      } else {
        currentGroup?.events.push(event);
      }
    }

    if (currentGroup) {
      groups.push(currentGroup);
    }

    return groups;
  }, [events]);

  const shouldShowYearSeparators = groupedEvents.length > 1;

  return (
    <div className="relative">
      {/* Main vertical timeline line */}
      <div className="absolute left-[7px] top-0 bottom-0 w-0.5 bg-border" />

      {shouldShowYearSeparators ? (
        <div className="space-y-6">
          {groupedEvents.map((group, groupIndex) => {
            const anchoredCount = group.events.filter(e => !!e.blockchainTxId).length;
            const isFirstGroup = groupIndex === 0;

            return (
              <div key={group.year} className="relative">
                {/* Year marker */}
                <div className={`relative flex items-center gap-3 ${isFirstGroup ? '' : 'pt-2'}`}>
                  {/* Year badge positioned on the timeline */}
                  <div className="relative z-10 flex items-center justify-center">
                    <div className="flex items-center gap-2 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground shadow-sm">
                      <span>{group.year}</span>
                      {anchoredCount > 0 && (
                        <span className="flex items-center gap-1 text-emerald-300">
                          <BlockchainIndicator hasBlockchainProof={true} size="sm" />
                          {anchoredCount}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {group.events.length} {group.events.length === 1 ? t('timeline.event') : t('timeline.events')}
                  </span>
                </div>

                {/* Events for this year */}
                <div className="mt-4 space-y-4">
                  {group.events.map((event, eventIndex) => (
                    <TimelineEvent
                      key={event.id}
                      event={event}
                      isCertified={isCertified(event)}
                      isLast={groupIndex === groupedEvents.length - 1 && eventIndex === group.events.length - 1}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event, index) => (
            <TimelineEvent
              key={event.id}
              event={event}
              isCertified={isCertified(event)}
              isLast={index === events.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface TimelineEventProps {
  event: Event;
  isCertified: boolean;
  isLast: boolean;
}

function TimelineEvent({ event, isCertified, isLast }: TimelineEventProps) {
  const hasBlockchainProof = !!event.blockchainTxId;

  return (
    <div className="relative pl-8">
      {/* Timeline connector dot */}
      <div className="absolute left-0 top-4 z-10">
        <div className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
          hasBlockchainProof
            ? 'border-emerald-500 bg-emerald-500/10'
            : isCertified
              ? 'border-primary bg-primary/10'
              : 'border-muted-foreground/50 bg-background'
        }`}>
          <div className={`h-2 w-2 rounded-full ${
            hasBlockchainProof
              ? 'bg-emerald-500'
              : isCertified
                ? 'bg-primary'
                : 'bg-muted-foreground/50'
          }`} />
        </div>
      </div>

      {/* Hide the main line at the last event */}
      {isLast && (
        <div className="absolute left-[7px] top-6 bottom-0 w-0.5 bg-card" />
      )}

      <EventCard event={event} isCertified={isCertified} />
    </div>
  );
}
