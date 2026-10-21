import type { SiteCopy } from '../i18n';
import { useRevealScope } from './hooks';
import { useRef } from 'react';

export default function Craft({ t }: { t: SiteCopy }) {
  const rootRef = useRef<HTMLElement>(null);
  useRevealScope(rootRef, []);

  return (
    <section className="section craft" id="craft" ref={rootRef}>
      <div className="wrap">
        <header className="section-head" data-reveal>
          <span className="rule" aria-hidden="true" />
          <h2 className="section-title">{t.craft.title}</h2>
          <p className="section-lede">{t.craft.lede}</p>
        </header>

        <ol className="craft-steps">
          {t.craft.steps.map((step, i) => (
            <li className="craft-step" key={step.n} data-reveal style={{ ['--i' as string]: i }}>
              <span className="craft-n">{step.n}</span>
              <h3 className="craft-title">{step.title}</h3>
              <p className="craft-body">{step.body}</p>
            </li>
          ))}
        </ol>

        <aside className="callout" data-reveal>
          <h3 className="callout-title">{t.craft.calloutTitle}</h3>
          <p className="callout-body">{t.craft.calloutBody}</p>
        </aside>

        <div className="craft-lower">
          <div className="craft-spec" data-reveal>
            <h3 className="callout-title">{t.craft.specTitle}</h3>
            <pre className="spec">
              <code>{t.craft.spec.join('\n')}</code>
            </pre>
          </div>
          <div className="craft-motion" data-reveal>
            <h3 className="callout-title">{t.craft.motionTitle}</h3>
            <p className="callout-body">{t.craft.motionBody}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
