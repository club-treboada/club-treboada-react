// src/lib/eventsRepository.js
import { supabase } from './supabaseClient';

const BUCKET = 'event-images';
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'webp']);

export const EVENT_KEYS = ['open-ritmica', 'open-acrobatica'];

function nullIfEmpty(v) {
  const s = typeof v === 'string' ? v.trim() : v;
  if (s === '' || s == null) return null;
  return s;
}

/**
 * Merge a DB row over the bundled static data for an Open page. Any field
 * that's null/empty in the DB row falls back to the static value, so the
 * page always renders something sensible before this table is seeded/edited.
 * @param {object|null} row
 * @param {object} fallback - the page's static data object (openRitmicaData, …)
 */
export function mergeEventRow(row, fallback) {
  const pick = (dbValue, fallbackValue) => {
    const v = typeof dbValue === 'string' ? dbValue.trim() : dbValue;
    return v ? dbValue : fallbackValue;
  };

  const details =
    row && Array.isArray(row.details_json) && row.details_json.length > 0
      ? row.details_json
      : fallback.eventDetails || [];

  return {
    ...fallback,
    title: pick(row?.title, fallback.title),
    subtitle: pick(row?.subtitle, fallback.subtitle),
    eventDate: pick(row?.event_date, fallback.eventDate),
    description: pick(row?.description, fallback.description),
    posterImage: pick(row?.poster_url, fallback.posterImage),
    contactEmail: pick(row?.contact_email, fallback.contactEmail),
    contactPhone: pick(row?.contact_phone, fallback.contactPhone),
    contactPerson: pick(row?.contact_person, fallback.contactPerson),
    eventDetails: details,
  };
}

/** Fetch one event row for public display (no session required). */
export async function getEvent(eventKey) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('event_key', eventKey)
    .maybeSingle();

  return { data: data ?? null, error };
}

/**
 * Fetch one event row for the admin form. Same select as the public one
 * (there's no draft state), kept as a separate export so admin call sites
 * read clearly and can diverge later if needed.
 */
export async function getEventForAdmin(eventKey) {
  return getEvent(eventKey);
}

/** Create or update the row for `eventKey` (admin/coach only, enforced by RLS). */
export async function upsertEvent(eventKey, payload) {
  const { data, error } = await supabase
    .from('events')
    .upsert({ event_key: eventKey, ...payload }, { onConflict: 'event_key' })
    .select('*')
    .single();

  return { data: data ?? null, error };
}

/**
 * Upload an event poster to Supabase Storage. Client-side guards mirror the
 * hero/discipline-images buckets.
 * @param {File} file
 * @returns {Promise<{ publicUrl: string | null, error: string | null }>}
 */
export async function uploadEventImage(file) {
  if (!file || !(file instanceof File)) {
    return { publicUrl: null, error: 'Ficheiro non válido.' };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { publicUrl: null, error: 'A imaxe debe ser menor de 2 MB.' };
  }

  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    return { publicUrl: null, error: 'Só se permiten JPG, PNG ou WEBP.' };
  }

  const path = `${crypto.randomUUID()}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || `image/${ext === 'jpg' ? 'jpeg' : ext}`,
    });

  if (upErr) {
    console.error('[events] upload failed', upErr);
    return { publicUrl: null, error: upErr.message || 'Erro ao subir a imaxe.' };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return { publicUrl: publicUrl || null, error: null };
}

/** Build an insert/update body from admin form state. */
export function buildEventPayloadFromForm({
  title,
  subtitle,
  eventDate,
  description,
  posterUrl,
  contactEmail,
  contactPhone,
  contactPerson,
  details,
}) {
  const cleanDetails = (details || [])
    .map((d) => ({
      icon: (d?.icon || '').trim(),
      text: (d?.text || '').trim(),
    }))
    .filter((d) => d.text);

  return {
    title: nullIfEmpty(title),
    subtitle: nullIfEmpty(subtitle),
    event_date: nullIfEmpty(eventDate),
    description: nullIfEmpty(description),
    poster_url: nullIfEmpty(posterUrl),
    contact_email: nullIfEmpty(contactEmail),
    contact_phone: nullIfEmpty(contactPhone),
    contact_person: nullIfEmpty(contactPerson),
    details_json: cleanDetails,
  };
}
