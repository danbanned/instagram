import { useState } from 'react';
import styles from './DashboardPage.module.css';

const STATS = [
  { label: 'Accounts reached',  value: '—', sub: 'Last 30 days' },
  { label: 'Accounts engaged',  value: '—', sub: 'Last 30 days' },
  { label: 'Total followers',   value: '196', sub: '+2 this week' },
];

export default function DashboardPage() {
  const [tab, setTab] = useState('insights');

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.heading}>Professional dashboard</h1>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === 'insights' ? styles.active : ''}`}
            onClick={() => setTab('insights')}
          >
            Insights
          </button>
          <button
            className={`${styles.tab} ${tab === 'adtools' ? styles.active : ''}`}
            onClick={() => setTab('adtools')}
          >
            Ad tools
          </button>
        </div>

        {tab === 'insights' ? (
          <>
            <div className={styles.statsRow}>
              {STATS.map(s => (
                <div key={s.label} className={styles.statCard}>
                  <span className={styles.statValue}>{s.value}</span>
                  <span className={styles.statLabel}>{s.label}</span>
                  <span className={styles.statSub}>{s.sub}</span>
                </div>
              ))}
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Content you've shared</h3>
              <p className={styles.sectionHint}>
                Share a post or reel to start tracking performance.
              </p>
            </div>
          </>
        ) : (
          <>
            <div className={styles.adCard}>
              <div className={styles.adCardText}>
                <p className={styles.adCardTitle}>Create your next ad</p>
                <p className={styles.adCardSub}>Boost a post to reach more people.</p>
              </div>
              <button className={styles.createAdBtn}>Create ad</button>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Other tools</h3>
              <div className={styles.toolItem}>Billing &amp; payments</div>
            </div>
          </>
        )}

        <footer className={styles.footer}>
          <div className={styles.footerLinks}>
            {['Meta','About','Blog','Jobs','Help','API','Privacy','Terms','Locations'].map((l, i, arr) => (
              <span key={l}>
                <a href="#" className={styles.footerLink}>{l}</a>
                {i < arr.length - 1 && <span className={styles.dot}> · </span>}
              </span>
            ))}
          </div>
          <p className={styles.copyright}>© 2026 Instagram from Meta</p>
        </footer>
      </div>
    </main>
  );
}
