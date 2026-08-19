import { useState } from 'react';
import { Download, Share2, AtSign, Link2, Rss, Check } from 'lucide-react';
import './SiteFooter.css';

export default function SiteFooter() {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  function handleShare() {
    const url = window.location.href;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }).catch(() => {
        // Fallback: open share dialog or prompt
        window.prompt('Copy this link to share:', url);
      });
    } else {
      window.prompt('Copy this link to share:', url);
    }
  }

  function handleDownloadPdf() {
    setDownloading(true);
    // Trigger browser print dialog — user can save as PDF
    setTimeout(() => {
      window.print();
      setDownloading(false);
    }, 200);
  }

  return (
    <footer className="site-footer">
      <div className="site-footer__top">
        <div className="site-footer__brand">
          <p className="site-footer__brand-name">FuturePath AI</p>
          <p className="site-footer__brand-tagline">Precision decision intelligence for complex future paths.</p>
        </div>

        <div className="site-footer__col">
          <p className="site-footer__col-heading">Actions</p>
          <button
            type="button"
            className="site-footer__link-btn"
            onClick={handleDownloadPdf}
            disabled={downloading}
            title="Save page as PDF using your browser's print dialog"
          >
            <Download size={13} strokeWidth={2} />
            {downloading ? 'Opening print…' : 'Download PDF Report'}
          </button>
          <button
            type="button"
            className={`site-footer__link-btn ${copied ? 'is-copied' : ''}`}
            onClick={handleShare}
            title="Copy shareable link to clipboard"
          >
            {copied ? <Check size={13} strokeWidth={2.5} /> : <Share2 size={13} strokeWidth={2} />}
            {copied ? 'Link copied!' : 'Share Simulation'}
          </button>
        </div>

        <div className="site-footer__col">
          <p className="site-footer__col-heading">Company</p>
          <a href="/about">About Us</a>
        </div>

        <div className="site-footer__col">
          <p className="site-footer__col-heading">Legal</p>
          <a href="/privacy">Privacy Policy</a>
          <a href="/terms">Terms of Service</a>
          <a href="/cookies">Cookie Policy</a>
        </div>

        <div className="site-footer__col">
          <p className="site-footer__col-heading">Connect</p>
          <div className="site-footer__socials">
            <a href="https://twitter.com"  target="_blank" rel="noopener noreferrer" aria-label="Twitter / X"><AtSign size={15} strokeWidth={2} /></a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><Link2 size={15} strokeWidth={2} /></a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><Rss size={15} strokeWidth={2} /></a>
          </div>
        </div>
      </div>

      <div className="site-footer__bottom">
        <span>© {new Date().getFullYear()} FuturePath AI. All rights reserved.</span>
      </div>
    </footer>
  );
}
