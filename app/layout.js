import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Generative Instagram AI',
  description: 'Generate and share AI images with DALL-E 2',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav style={styles.nav}>
          <h1 style={styles.logo}>🎨 Generative Instagram AI</h1>
          <div style={styles.navLinks}>
            <a href="/" style={styles.navLink}>Generate</a>
            <a href="/feed" style={styles.navLink}>Feed</a>
          </div>
        </nav>
        <main style={styles.main}>
          {children}
        </main>
      </body>
    </html>
  );
}

const styles = {
  nav: {
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e0e0e0',
    padding: '1rem 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    fontSize: '1.5rem',
    margin: 0,
    color: '#333',
  },
  navLinks: {
    display: 'flex',
    gap: '2rem',
  },
  navLink: {
    color: '#666',
    textDecoration: 'none',
    fontWeight: '500',
  },
  main: {
    padding: '2rem',
    maxWidth: '1200px',
    margin: '0 auto',
  },
};