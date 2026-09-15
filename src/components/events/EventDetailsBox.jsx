// src/components/events/EventDetailsBox.jsx
import Card from '../UI/Card';
import eventStyles from '../../pages/events/EventTemplate.module.css';
import styles from './EventDetailsBox.module.css';

/**
 * Renders the "Detalles do evento" box under the description card on an
 * Open event page. Data-driven so coaches can edit it from /admin/eventos;
 * renders nothing if there are no items.
 */
const EventDetailsBox = ({ title = 'Detalles del Evento', items = [] }) => {
  if (!items || items.length === 0) return null;

  return (
    <Card hoverEffect={true} className={eventStyles.contactCard}>
      <h4>{title}</h4>
      <ul className={styles.list}>
        {items.map((item, index) => (
          <li key={index} className={styles.item}>
            {item.icon && <span className={styles.icon}>{item.icon}</span>}
            <span>{item.text}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
};

export default EventDetailsBox;
