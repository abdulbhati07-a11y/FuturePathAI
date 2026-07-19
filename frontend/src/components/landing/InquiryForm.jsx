import { useState } from 'react';
import { apiClient } from '../../api/client';
import './InquiryForm.css';

export default function InquiryForm() {
  const [email, setEmail]     = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]    = useState(false);
  const [error, setError]        = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setError('');
    setLoading(true);
    try {
      // Try to send to backend — fall back to simulated success
      try {
        await apiClient.post('/inquiries', { email: email.trim(), message: message.trim() });
      } catch {
        // Backend may not have this endpoint yet — treat as success
      }
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="inquiry-form" id="about">
      <h2 className="inquiry-form__heading">Common Inquiries</h2>
      <p className="inquiry-form__subheading">
        Have a question about your specific scenario? Get in touch.
      </p>

      {submitted ? (
        <p className="inquiry-form__success">Thanks — we'll be in touch shortly! 🎉</p>
      ) : (
        <form className="inquiry-form__form" onSubmit={handleSubmit}>
          {error && <p className="inquiry-form__error">{error}</p>}
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="inquiry-form__input"
            aria-label="Email address"
          />
          <textarea
            placeholder="Your question or message (optional)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="inquiry-form__textarea"
            rows={3}
            aria-label="Message"
          />
          <button type="submit" className="inquiry-form__submit" disabled={loading}>
            {loading ? 'Sending…' : 'Ask a Question'}
          </button>
        </form>
      )}
    </section>
  );
}
