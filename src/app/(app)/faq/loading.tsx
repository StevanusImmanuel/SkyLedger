export default function FaqLoading() {
  return (
    <div>
      <div className="sl-faq-header">
        <div style={{ width: '100%' }}>
          <div className="skeleton" style={{ width: 130, height: 10, borderRadius: 4, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: 'min(420px, 100%)', height: 32, borderRadius: 6, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: 'min(560px, 100%)', height: 12, borderRadius: 4 }} />
        </div>
        <div className="skeleton" style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0 }} />
      </div>

      <div className="sl-faq-search-card">
        <div className="skeleton" style={{ flex: 1, height: 38, borderRadius: 8 }} />
        <div className="skeleton" style={{ width: 86, height: 24, borderRadius: 999 }} />
      </div>

      <div className="sl-faq-grid">
        {Array.from({ length: 3 }).map((_, categoryIndex) => (
          <section key={categoryIndex} className="sl-faq-card">
            <div className="sl-faq-category-header">
              <div style={{ width: '100%' }}>
                <div className="skeleton" style={{ width: 160, height: 18, borderRadius: 4, marginBottom: 8 }} />
                <div className="skeleton" style={{ width: '80%', height: 12, borderRadius: 4 }} />
              </div>
            </div>
            <div className="sl-faq-list">
              {Array.from({ length: 3 }).map((__, itemIndex) => (
                <div key={itemIndex} className="sl-faq-item">
                  <div className="sl-faq-question">
                    <div className="skeleton" style={{ width: '70%', height: 14, borderRadius: 4 }} />
                    <div className="skeleton" style={{ width: 16, height: 16, borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
