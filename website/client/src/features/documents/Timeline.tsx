import type { TimelineDto } from '@mediconnect/shared';
import { t } from '../../i18n';
import { Link } from 'react-router-dom';
import { formatDate } from '../../lib/format';
import s from './documents.module.css';

// UC-504 — xronoloji tarixçə: tip ikonu/rəngi (FR-504-03), həkim, klinika, keçid (FR-504-09).

const TYPE_LABEL = { APPOINTMENT: t('docs.tlAPPOINTMENT'), PRESCRIPTION: t('docs.tlPRESCRIPTION'), DOCUMENT: t('docs.tlDOCUMENT') } as const;

export function Timeline({ data }: { data: TimelineDto }) {
  if (data.events.length === 0) return <p className="ink-soft">{t('docs.tlEmpty')}</p>;
  return (
    <div className={s.timeline}>
      {data.events.map((e) => {
        const body = (
          <>
            <span className={`${s.dot} ${s[`dot_${e.type}`]}`} aria-hidden="true" />
            <div className={s.eventHead}>
              <span>
                {TYPE_LABEL[e.type]} · {formatDate(e.date)}
              </span>
              <span>{[e.doctorName, e.clinicName].filter(Boolean).join(' · ')}</span>
            </div>
            <div className={s.eventTitle}>{e.title}</div>
            {e.description && <div className="ink-soft" style={{ fontSize: 14, marginTop: 4 }}>{e.description}</div>}
          </>
        );
        return e.link ? (
          <Link key={e.eventId} to={e.link} className={s.event}>
            {body}
          </Link>
        ) : (
          <div key={e.eventId} className={s.event}>
            {body}
          </div>
        );
      })}
    </div>
  );
}
