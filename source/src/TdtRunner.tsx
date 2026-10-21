import { useEffect, useMemo, useRef, useState } from 'react';
import { generateTakes } from './ai/director';
import StoryCanvas from './components/StoryCanvas';
import type { LookId, Story } from './engine/types';

/**
 * TDT runner — the instrument for the Take-Distinguishability Test.
 *
 * It does not "run the study": a human moderator does. What it removes is the
 * excuse that there was nothing to run it with. It shows the three takes with
 * their labels hidden (the protocol's requirement), counterbalances card
 * position across participants, records each description verbatim, and exports
 * a full sheet plus a blind sheet for coding.
 *
 * Open with ?tdt=1.
 */

const STORE = 'athar.tdt.v1';

// One fixed stimulus for every participant: same day, same seed, same verses.
const STIMULUS_DATE = new Date(2026, 9, 18);
const LOOKS: LookId[] = ['sakina', 'dhahab', 'hibr'];
const LETTERS = ['أ', 'ب', 'ج'];

const PERMS: LookId[][] = [
  ['sakina', 'dhahab', 'hibr'],
  ['sakina', 'hibr', 'dhahab'],
  ['dhahab', 'sakina', 'hibr'],
  ['dhahab', 'hibr', 'sakina'],
  ['hibr', 'sakina', 'dhahab'],
  ['hibr', 'dhahab', 'sakina'],
];

interface Session {
  pid: number;
  startedAt: string;
  durationS: number;
  order: LookId[];
  desc: Record<string, string>;
  pair: [LookId, LookId] | null;
  prefer: LookId | null;
  bundle: string;
  viewport: string;
  ua: string;
}

function load(): Session[] {
  try {
    return JSON.parse(localStorage.getItem(STORE) || '[]');
  } catch {
    return [];
  }
}

function save(rows: Session[]) {
  localStorage.setItem(STORE, JSON.stringify(rows));
}

function csvCell(v: string | number) {
  const s = String(v ?? '');
  return `"${s.replace(/"/g, '""')}"`;
}

function download(name: string, text: string) {
  const blob = new Blob(['\ufeff' + text], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

function bundleName(): string {
  const s = Array.from(document.querySelectorAll<HTMLScriptElement>('script[src]')).find((x) =>
    /\/assets\/index-.*\.js$/.test(x.src),
  );
  return s ? (s.src.split('/').pop() as string) : 'dev';
}

export default function TdtRunner() {
  const [rows, setRows] = useState<Session[]>(() => load());
  const [stage, setStage] = useState<'start' | 'study' | 'done'>('start');
  const [admin, setAdmin] = useState(false);
  const [desc, setDesc] = useState<Record<string, string>>({});
  const [pair, setPair] = useState<[LookId, LookId] | null>(null);
  const [prefer, setPrefer] = useState<LookId | null>(null);
  const started = useRef<number>(0);

  const order = useMemo(() => PERMS[rows.length % PERMS.length], [rows.length]);

  const byLook = useMemo(() => {
    const all = generateTakes('شكر', 'ar', STIMULUS_DATE, 0);
    const map: Record<string, Story> = {};
    for (const s of all) map[s.look] = s;
    return map;
  }, []);

  useEffect(() => {
    document.documentElement.lang = 'ar';
    document.documentElement.dir = 'rtl';
  }, []);

  const start = () => {
    setDesc({});
    setPair(null);
    setPrefer(null);
    started.current = Date.now();
    setStage('study');
  };

  const complete = () => {
    const session: Session = {
      pid: rows.length + 1,
      startedAt: new Date().toISOString(),
      durationS: Math.round((Date.now() - started.current) / 1000),
      order,
      desc,
      pair,
      prefer,
      bundle: bundleName(),
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      ua: navigator.userAgent.slice(0, 160),
    };
    const next = [...rows, session];
    setRows(next);
    save(next);
    setStage('done');
  };

  const ready = order.every((l) => (desc[l] || '').trim().length >= 3) && pair !== null;

  const exportFull = () => {
    const head = [
      'participant_id',
      'started_at',
      'duration_s',
      'card1_look',
      'card2_look',
      'card3_look',
      'card1_desc',
      'card2_desc',
      'card3_desc',
      'pair_most_similar',
      'preferred',
      'bundle',
      'viewport',
      'user_agent',
    ].join(',');
    const body = rows
      .map((r) =>
        [
          r.pid,
          r.startedAt,
          r.durationS,
          r.order[0],
          r.order[1],
          r.order[2],
          r.desc[r.order[0]] || '',
          r.desc[r.order[1]] || '',
          r.desc[r.order[2]] || '',
          r.pair ? `${r.pair[0]}+${r.pair[1]}` : '',
          r.prefer || '',
          r.bundle,
          r.viewport,
          r.ua,
        ]
          .map(csvCell)
          .join(','),
      )
      .join('\n');
    download('athar-tdt-full.csv', head + '\n' + body);
  };

  const exportBlind = () => {
    // No look names, no order: the coder must not know which take is which.
    const head = ['participant_id', 'card1_desc', 'card2_desc', 'card3_desc', 'pair_cards', 'preferred_card', 'coder', 'card1_axis', 'card2_axis', 'card3_axis', 'notes'].join(',');
    const body = rows
      .map((r) => {
        const idx = (l: LookId) => LETTERS[r.order.indexOf(l)] || '';
        return [
          r.pid,
          r.desc[r.order[0]] || '',
          r.desc[r.order[1]] || '',
          r.desc[r.order[2]] || '',
          r.pair ? `${idx(r.pair[0])}+${idx(r.pair[1])}` : '',
          r.prefer ? idx(r.prefer) : '',
          '',
          '',
          '',
          '',
          '',
        ]
          .map(csvCell)
          .join(',');
      })
      .join('\n');
    download('athar-tdt-blind.csv', head + '\n' + body);
  };

  const clearAll = () => {
    if (!confirm('حذف كل الجلسات؟ لا يمكن التراجع.')) return;
    setRows([]);
    save([]);
  };

  return (
    <div className="tdt">
      <button className="tdt-admin-toggle" onClick={() => setAdmin((v) => !v)} aria-label="لوحة المشرف">
        ⋯
      </button>

      {admin && (
        <div className="tdt-admin" role="dialog" aria-label="لوحة المشرف">
          <div className="tdt-admin-row">
            <strong>{rows.length}</strong> جلسة مسجّلة
          </div>
          <div className="tdt-admin-row tdt-mono">bundle: {bundleName()}</div>
          <button className="tdt-btn" onClick={exportFull} disabled={!rows.length}>
            تصدير CSV (كامل)
          </button>
          <button className="tdt-btn" onClick={exportBlind} disabled={!rows.length}>
            تصدير CSV (أعمى — للترميز)
          </button>
          <button className="tdt-btn tdt-danger" onClick={clearAll} disabled={!rows.length}>
            حذف الكل
          </button>
          <button className="tdt-btn tdt-quiet" onClick={() => setAdmin(false)}>
            إغلاق
          </button>
        </div>
      )}

      {stage === 'start' && (
        <div className="tdt-panel">
          <div className="tdt-kicker">اختبار تمييز القصص · TDT</div>
          <h1 className="tdt-h1">جلسة جديدة</h1>
          <p className="tdt-lede">
            للمشرف: ضع الجهاز أمام المشارك، ثم اضغط «ابدأ». لا تشرح أي شيء عن القصص.
          </p>
          <ul className="tdt-list">
            <li>ثلاث قصص، بلا أسماء، بترتيب يتغيّر مع كل مشارك.</li>
            <li>جملة واحدة قصيرة لكل قصة، بكلمات المشارك نفسه.</li>
            <li>سؤال أخير: أي قصتين تشبهان بعضهما أكثر؟</li>
          </ul>
          <div className="tdt-note">
            رقم المشارك القادم: <strong>{rows.length + 1}</strong>
          </div>
          <button className="tdt-primary" onClick={start}>
            ابدأ
          </button>
        </div>
      )}

      {stage === 'study' && (
        <div className="tdt-study">
          <p className="tdt-prompt">شاهد القصص الثلاث، ثم صف كل واحدة بجملة واحدة قصيرة.</p>

          <div className="tdt-cards">
            {order.map((look, i) => (
              <figure className="tdt-card" key={look}>
                <StoryCanvas story={byLook[look]} className="tdt-canvas" />
                <figcaption className="tdt-letter">{LETTERS[i]}</figcaption>
              </figure>
            ))}
          </div>

          <div className="tdt-questions">
            {order.map((look, i) => (
              <label className="tdt-field" key={look}>
                <span className="tdt-label">
                  القصة {LETTERS[i]} — ما هذه القصة؟ جملة واحدة.
                </span>
                <textarea
                  value={desc[look] || ''}
                  onChange={(e) => setDesc((d) => ({ ...d, [look]: e.target.value }))}
                  rows={2}
                  maxLength={160}
                  placeholder="مثال: نور هادئ في الليل…"
                />
              </label>
            ))}

            <fieldset className="tdt-field tdt-fieldset">
              <legend className="tdt-label">أي قصتين تشبهان بعضهما أكثر؟</legend>
              <div className="tdt-choices">
                {[0, 1, 2].flatMap((a) =>
                  [a + 1, a + 2]
                    .filter((b) => b < 3)
                    .map((b) => {
                      const p: [LookId, LookId] = [order[a], order[b]];
                      const on = pair && pair[0] === p[0] && pair[1] === p[1];
                      return (
                        <button
                          key={`${a}-${b}`}
                          type="button"
                          className={`tdt-choice${on ? ' is-on' : ''}`}
                          aria-pressed={!!on}
                          onClick={() => setPair(p)}
                        >
                          {LETTERS[a]} + {LETTERS[b]}
                        </button>
                      );
                    }),
                )}
              </div>
            </fieldset>

            <fieldset className="tdt-field tdt-fieldset">
              <legend className="tdt-label">أي واحدة أعجبتك أكثر؟ (اختياري)</legend>
              <div className="tdt-choices">
                {order.map((look, i) => (
                  <button
                    key={look}
                    type="button"
                    className={`tdt-choice${prefer === look ? ' is-on' : ''}`}
                    aria-pressed={prefer === look}
                    onClick={() => setPrefer(prefer === look ? null : look)}
                  >
                    {LETTERS[i]}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="tdt-foot">
            <button className="tdt-primary" onClick={complete} disabled={!ready}>
              تم
            </button>
            <span className="tdt-hint">
              {ready ? 'شكرًا لك.' : 'اكتب جملة لكل قصة، واختر أقرب قصتين.'}
            </span>
          </div>
        </div>
      )}

      {stage === 'done' && (
        <div className="tdt-panel">
          <div className="tdt-kicker">تم التسجيل</div>
          <h1 className="tdt-h1">شكرًا جزيلًا.</h1>
          <p className="tdt-lede">يمكنك إعادة الجهاز إلى المشرف الآن.</p>
          <button className="tdt-primary" onClick={() => setStage('start')}>
            الجلسة التالية
          </button>
        </div>
      )}
    </div>
  );
}
