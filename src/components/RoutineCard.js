'use client';

import './RoutineCard.css';

export default function RoutineCard({ routine }) {
  if (!routine) return null;

  const schedule = routine.schedule || {};
  const daily = schedule.daily || [];
  const weekly = schedule.weekly || [];
  const reminders = schedule.reminders || [];

  return (
    <div className="card routine-card">
      <h3 className="routine-card__title">{routine.title}</h3>

      {daily.length > 0 && (
        <div className="routine-card__section">
          <h4 className="routine-card__section-title">Daily Schedule</h4>
          <div className="routine-card__timeline">
            {daily.map((item, i) => (
              <div key={i} className="routine-card__item">
                <span className="routine-card__time">{item.time}</span>
                <div>
                  <div className="routine-card__activity">{item.activity}</div>
                  {item.notes && (
                    <div className="routine-card__notes">{item.notes}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {weekly.length > 0 && (
        <div className="routine-card__section">
          <h4 className="routine-card__section-title">Weekly Tasks</h4>
          <div className="routine-card__timeline">
            {weekly.map((item, i) => (
              <div key={i} className="routine-card__item">
                <span className="routine-card__day">{item.day}</span>
                <div>
                  <div className="routine-card__activity">{item.activity}</div>
                  {item.notes && (
                    <div className="routine-card__notes">{item.notes}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {reminders.length > 0 && (
        <div className="routine-card__section">
          <h4 className="routine-card__section-title">Reminders</h4>
          <div className="routine-card__reminders">
            <ul>
              {reminders.map((reminder, i) => (
                <li key={i}>{reminder}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
