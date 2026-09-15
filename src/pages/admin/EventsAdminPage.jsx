// src/pages/admin/EventsAdminPage.jsx
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import openRitmicaData from '../../data/openRitmicaData';
import openAcrobaticaData from '../../data/openAcrobaticaData';
import {
  buildEventPayloadFromForm,
  getEventForAdmin,
  mergeEventRow,
  upsertEvent,
  uploadEventImage,
} from '../../lib/eventsRepository';
import styles from './EventsAdminPage.module.css';

const EVENTS = [
  { key: 'open-ritmica', label: 'Open Rítmica', path: '/open-ritmica', fallback: openRitmicaData },
  { key: 'open-acrobatica', label: 'Open Acrobática', path: '/open-acrobatica', fallback: openAcrobaticaData },
];

const emptyForm = () => ({
  title: '',
  subtitle: '',
  eventDate: '',
  description: '',
  posterUrl: '',
  contactEmail: '',
  contactPhone: '',
  contactPerson: '',
  details: [],
});

function mergedToForm(merged) {
  return {
    title: merged.title || '',
    subtitle: merged.subtitle || '',
    eventDate: merged.eventDate || '',
    description: merged.description || '',
    posterUrl: merged.posterImage || '',
    contactEmail: merged.contactEmail || '',
    contactPhone: merged.contactPhone || '',
    contactPerson: merged.contactPerson || '',
    details: (merged.eventDetails || []).map((d) => ({ icon: d.icon || '', text: d.text || '' })),
  };
}

const EventsAdminPage = () => {
  const [eventKey, setEventKey] = useState(EVENTS[0].key);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [objectUrl, setObjectUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  const activeEvent = EVENTS.find((e) => e.key === eventKey);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSaved(false);
    const { data, error: fetchErr } = await getEventForAdmin(eventKey);
    if (fetchErr) {
      console.error('[admin-events]', fetchErr);
      setError(fetchErr.message || 'Non se puido cargar o evento.');
    }
    const fallback = EVENTS.find((e) => e.key === eventKey).fallback;
    setForm(mergedToForm(mergeEventRow(data, fallback)));
    setFile(null);
    setLoading(false);
  }, [eventKey]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!file) {
      setObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const updateField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  };

  const updateDetail = (index, key, value) => {
    setForm((f) => ({
      ...f,
      details: f.details.map((d, i) => (i === index ? { ...d, [key]: value } : d)),
    }));
    setSaved(false);
  };

  const addDetail = () => {
    setForm((f) => ({ ...f, details: [...f.details, { icon: '', text: '' }] }));
  };

  const removeDetail = (index) => {
    setForm((f) => ({ ...f, details: f.details.filter((_, i) => i !== index) }));
  };

  const moveDetail = (index, delta) => {
    const target = index + delta;
    if (target < 0 || target >= form.details.length) return;
    setForm((f) => {
      const details = f.details.slice();
      const [moved] = details.splice(index, 1);
      details.splice(target, 0, moved);
      return { ...f, details };
    });
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    setFile(f || null);
    setError(null);
    setSaved(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      let posterUrl = form.posterUrl.trim();
      if (file) {
        const { publicUrl, error: upErr } = await uploadEventImage(file);
        if (upErr) {
          setError(upErr);
          setSaving(false);
          return;
        }
        posterUrl = publicUrl || '';
      }

      const payload = buildEventPayloadFromForm({
        title: form.title,
        subtitle: form.subtitle,
        eventDate: form.eventDate,
        description: form.description,
        posterUrl,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
        contactPerson: form.contactPerson,
        details: form.details,
      });

      const { error: saveErr } = await upsertEvent(eventKey, payload);
      if (saveErr) {
        setError(saveErr.message || 'Non se puido gardar.');
        setSaving(false);
        return;
      }

      setFile(null);
      setForm((f) => ({ ...f, posterUrl }));
      setSaved(true);
    } catch (err) {
      console.error('[admin-events]', err);
      setError(err?.message || 'Erro inesperado.');
    } finally {
      setSaving(false);
    }
  };

  const displayImg = objectUrl || (form.posterUrl ? form.posterUrl : null);

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Páxinas Open</h1>
            <p className={styles.subtitle}>
              Edita o cartel, o texto da tarxeta e os detalles do evento en{' '}
              {activeEvent && <Link to={activeEvent.path}>{activeEvent.label}</Link>}.
            </p>
          </div>
        </header>

        <div className={styles.tabs}>
          {EVENTS.map((ev) => (
            <button
              key={ev.key}
              type="button"
              className={`${styles.tab} ${eventKey === ev.key ? styles.tabActive : ''}`}
              onClick={() => setEventKey(ev.key)}
            >
              {ev.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className={styles.loading}>Cargando…</p>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            {error && <p className={styles.error}>{error}</p>}
            {saved && <p className={styles.success}>Cambios gardados.</p>}

            <div className={styles.row2}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="ev-title">
                  Título
                </label>
                <input
                  id="ev-title"
                  className={styles.input}
                  value={form.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  maxLength={150}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="ev-date">
                  Data do evento
                </label>
                <input
                  id="ev-date"
                  className={styles.input}
                  value={form.eventDate}
                  onChange={(e) => updateField('eventDate', e.target.value)}
                  placeholder="Ximnasia Rítmica, 4 de Octubre, 2026"
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="ev-subtitle">
                Subtítulo (cabeceira da tarxeta)
              </label>
              <input
                id="ev-subtitle"
                className={styles.input}
                value={form.subtitle}
                onChange={(e) => updateField('subtitle', e.target.value)}
                maxLength={200}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="ev-description">
                Descrición (texto da tarxeta)
              </label>
              <textarea
                id="ev-description"
                className={styles.textarea}
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={8}
              />
            </div>

            <div className={styles.field}>
              <span className={styles.label}>Cartel (máx. 2 MB)</span>
              <label className={styles.dropZone}>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                  className={styles.fileInput}
                  onChange={handleFileChange}
                />
                Arrastra ou fai clic para escoller ficheiro
              </label>
              {file && (
                <p className={styles.hint}>
                  Seleccionado: {file.name} — substituirá o cartel actual ao gardar.
                </p>
              )}
              {displayImg && <img src={displayImg} alt="" className={styles.preview} />}
              <input
                className={styles.input}
                value={form.posterUrl}
                onChange={(e) => {
                  updateField('posterUrl', e.target.value);
                  setFile(null);
                }}
                placeholder="ou pega unha URL de imaxe (/images/…)"
              />
            </div>

            <div className={styles.row2}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="ev-email">
                  Email de contacto
                </label>
                <input
                  id="ev-email"
                  className={styles.input}
                  value={form.contactEmail}
                  onChange={(e) => updateField('contactEmail', e.target.value)}
                  placeholder="torneoclubtreboada@gmail.com"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="ev-phone">
                  Teléfono de contacto
                </label>
                <input
                  id="ev-phone"
                  className={styles.input}
                  value={form.contactPhone}
                  onChange={(e) => updateField('contactPhone', e.target.value)}
                  placeholder="613 99 07 13"
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="ev-contact-person">
                Persoa de contacto
              </label>
              <input
                id="ev-contact-person"
                className={styles.input}
                value={form.contactPerson}
                onChange={(e) => updateField('contactPerson', e.target.value)}
                placeholder="Laura"
              />
            </div>

            <div className={styles.field}>
              <span className={styles.label}>Detalles do evento (caixa baixo a tarxeta)</span>
              <p className={styles.hint}>
                Cada fila é unha liña coa súa icona/emoji. Déixao baleiro para non mostrar a caixa.
              </p>
              <div className={styles.detailList}>
                {form.details.map((detail, index) => (
                  <div key={index} className={styles.detailRow}>
                    <input
                      className={styles.iconInput}
                      value={detail.icon}
                      onChange={(e) => updateDetail(index, 'icon', e.target.value)}
                      placeholder="🏆"
                      aria-label="Icona"
                    />
                    <input
                      className={styles.input}
                      value={detail.text}
                      onChange={(e) => updateDetail(index, 'text', e.target.value)}
                      placeholder="Modalidades: Individual y Conjuntos"
                      aria-label="Texto"
                    />
                    <div className={styles.detailActions}>
                      <button
                        type="button"
                        className={styles.orderBtn}
                        onClick={() => moveDetail(index, -1)}
                        disabled={index === 0}
                        aria-label="Subir"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className={styles.orderBtn}
                        onClick={() => moveDetail(index, +1)}
                        disabled={index === form.details.length - 1}
                        aria-label="Baixar"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className={styles.btnGhost}
                        onClick={() => removeDetail(index)}
                        aria-label="Eliminar"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" className={styles.btnSecondary} onClick={addDetail}>
                Engadir detalle
              </button>
            </div>

            <div className={styles.footer}>
              <button type="button" className={styles.btnSecondary} onClick={load} disabled={saving}>
                Descartar cambios
              </button>
              <button type="submit" className={styles.btnPrimary} disabled={saving}>
                {saving ? 'Gardando…' : 'Gardar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EventsAdminPage;
