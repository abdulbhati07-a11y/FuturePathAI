import { useParams, useNavigate, useLocation } from 'react-router-dom';
import PublicNav from '../components/landing/PublicNav';
import SiteFooter from '../components/SiteFooter';
import './LegalPage.css';

// One date for all three documents. They were revised together, so a per-page
// literal only creates the chance of them drifting apart silently.
const LAST_UPDATED = 'August 20, 2026';

const CONTENT = {
  privacy: {
    title: 'Privacy Policy',
    lastUpdated: LAST_UPDATED,
    sections: [
      {
        heading: 'Information We Collect',
        body: 'We collect information you provide directly to us, such as when you create an account, run a simulation, or contact us. This includes your name, email address, and simulation data.',
      },
      {
        heading: 'How We Use Your Information',
        body: 'We use the information we collect to provide, maintain, and improve our services, process transactions, send you technical notices and support messages, and respond to your comments and questions.',
      },
      {
        heading: 'Information Sharing',
        body: 'We do not share, sell, or rent your personal information to third parties for their promotional purposes. We may share information in response to legal obligations or to protect the rights of FuturePath AI.',
      },
      {
        heading: 'Data Security',
        body: 'We take reasonable measures to help protect your personal information from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction.',
      },
      {
        heading: 'Contact Us',
        body: 'If you have any questions about this Privacy Policy, please contact us at privacy@futurepathai.org.',
      },
    ],
  },
  terms: {
    title: 'Terms of Service',
    lastUpdated: LAST_UPDATED,
    sections: [
      {
        heading: 'Acceptance of Terms',
        body: 'By using FuturePath AI, you agree to these Terms of Service. If you do not agree to these terms, please do not use our service.',
      },
      {
        heading: 'Use of Service',
        body: 'FuturePath AI provides AI-powered decision simulation tools for informational purposes only. The simulations and insights provided are not financial, legal, or professional advice.',
      },
      {
        heading: 'User Accounts',
        body: 'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.',
      },
      {
        heading: 'Intellectual Property',
        body: 'FuturePath AI and its original content, features, and functionality are owned by FuturePath AI and are protected by intellectual property laws.',
      },
      {
        heading: 'Disclaimer',
        body: 'FuturePath AI is provided "as is" without warranty of any kind. We do not guarantee the accuracy of simulation results and are not responsible for decisions made based on our service.',
      },
    ],
  },
  cookies: {
    title: 'Cookie Policy',
    lastUpdated: LAST_UPDATED,
    sections: [
      {
        heading: 'What Are Cookies',
        body: 'Cookies are small text files stored on your device when you visit our website. They help us provide a better experience by remembering your preferences and session data.',
      },
      {
        heading: 'Cookies We Use',
        body: 'We use essential cookies for authentication and session management, preference cookies to remember your settings, and analytics cookies to understand how our service is used.',
      },
      {
        heading: 'Managing Cookies',
        body: 'You can control cookie settings through your browser preferences. Note that disabling certain cookies may affect the functionality of FuturePath AI.',
      },
      {
        heading: 'Contact Us',
        body: 'For questions about our cookie policy, please contact us at privacy@futurepathai.org.',
      },
    ],
  },
};

export default function LegalPage() {
  const { page } = useParams();
  const navigate  = useNavigate();
  const location  = useLocation();

  // Derive page key from route param or from pathname (/privacy, /terms, /cookies)
  const pageKey = page || location.pathname.replace('/', '');
  const content = CONTENT[pageKey];

  if (!content) {
    navigate('/', { replace: true });
    return null;
  }  return (
    <div className="legal-page">
      <PublicNav />
      <main className="legal-page__main">
        <div className="legal-page__back-bar">
          <button type="button" className="legal-page__back-btn" onClick={() => navigate(-1)}>
            ← Back
          </button>
        </div>
        <div className="legal-page__card">
          <h1 className="legal-page__title">{content.title}</h1>
          <p className="legal-page__updated">Last updated: {content.lastUpdated}</p>
          {content.sections.map(s => (
            <div key={s.heading} className="legal-page__section">
              <h2 className="legal-page__section-heading">{s.heading}</h2>
              <p className="legal-page__section-body">{s.body}</p>
            </div>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
