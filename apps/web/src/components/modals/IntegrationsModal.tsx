import { useApp } from '../../app/AppContext';
import { INTEGRATIONS } from '../../lib/data';
import { Icon } from '../Icon';

export function IntegrationsModal() {
  const { setShowIntegrations } = useApp();

  const close = () => setShowIntegrations(false);

  return (
    <div className="modal-backdrop" onClick={close}>
      <div className="modal" style={{ maxWidth: 680 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h2>Integrations <em>· how bookings get here</em></h2>
            <button className="icon-btn" aria-label="Close" onClick={close}><Icon.Close /></button>
          </div>
        </div>
        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {INTEGRATIONS.map((it) => (
            <div key={it.key} className="integ-row">
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <strong style={{ fontSize: 14 }}>{it.name}</strong>
                  <span className={`integ-status ${it.status}`}>
                    {it.status === 'active' && '● Connected'}
                    {it.status === 'email-only' && '◐ Via forwarding'}
                    {it.status === 'available' && '○ Available'}
                  </span>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 2, lineHeight: 1.5 }}>{it.desc}</div>
                {it.meta && (
                  <div style={{ fontSize: 11.5, color: 'var(--ink-2)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                    {it.meta}{it.count ? ' · ' + it.count : ''}
                  </div>
                )}
              </div>
              <button className="btn" style={{ padding: '6px 12px' }}>
                {it.status === 'active' ? 'Manage' : 'Connect'}
              </button>
            </div>
          ))}
        </div>
        <div className="modal-foot">
          <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Everything here is read-only or email-based. Your inbox stays yours.</span>
          <button className="btn primary" onClick={close}>Done</button>
        </div>
      </div>
    </div>
  );
}
