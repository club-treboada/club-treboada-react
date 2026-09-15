// src/pages/OpenRitmica.jsx
import React, { useEffect, useState } from 'react';
import EventTemplate from './EventTemplate';
import EventDetailsBox from '../../components/events/EventDetailsBox';
import openRitmicaData from '../../data/openRitmicaData';
import { getEvent, mergeEventRow } from '../../lib/eventsRepository';

const EVENT_KEY = 'open-ritmica';

const OpenRitmica = () => {
  const [eventData, setEventData] = useState(() => mergeEventRow(null, openRitmicaData));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await getEvent(EVENT_KEY);
      if (cancelled) return;
      if (error) {
        // Fall back to the bundled static data so the page never breaks
        // (network down, table not migrated yet, etc.).
        console.warn('[open-ritmica] falling back to static data:', error.message);
      }
      setEventData(mergeEventRow(data, openRitmicaData));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <EventTemplate {...eventData}>
      <EventDetailsBox items={eventData.eventDetails} />
    </EventTemplate>
  );
};

export default OpenRitmica;
