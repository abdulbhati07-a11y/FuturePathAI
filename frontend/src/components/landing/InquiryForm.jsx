import { useNavigate } from 'react-router-dom';
import { MessageSquare, ArrowRight } from 'lucide-react';
import './InquiryForm.css';

/**
 * This section used to be a contact form: an email field, a message box, a
 * "Sending…" button that waited 500ms, and then "Thanks — we'll be in touch
 * shortly! 🎉". Nothing was ever sent. The old code said so outright
 * ("it just simulates success"), and both the email address and the question
 * were discarded the moment the component re-rendered.
 *
 * That is worse than a cosmetic bug. Someone with a real question typed it out,
 * handed over their address, and was told a person would reply. Nobody could
 * have replied — there was no recipient, no stored row, and no mailbox.
 *
 * It cannot be made to deliver from here: this repo has never run a migration,
 * so there is no table to write an inquiry to, and futurepathai.org mail is not
 * set up yet, so there is no address to send one to. Rather than keep the lie or
 * silently delete the only "contact us" on the site, the section now says what
 * is actually true and points at the one channel that does work today — the
 * advisor inside the product, which answers questions about the scenario you
 * give it.
 *
 * To turn this back into a real form, the missing piece is a recipient. Given
 * an address, the submit handler becomes a mailto: compose; given the repo's
 * first migration, it becomes an Inquiry row plus an admin view.
 */
export default function InquiryForm() {
  const navigate = useNavigate();

  return (
    <section className="inquiry-form" id="about">
      <h2 className="inquiry-form__heading">Questions about your own situation?</h2>
      <p className="inquiry-form__subheading">
        The advisor inside FuturePath is built for exactly that. Describe your
        scenario and it works through your numbers with you — not a generic FAQ
        answer, and not a reply that takes days.
      </p>

      <div className="inquiry-form__actions">
        <button
          type="button"
          className="inquiry-form__submit"
          onClick={() => navigate('/register')}
        >
          <MessageSquare size={15} strokeWidth={2} />
          Ask the advisor
          <ArrowRight size={15} strokeWidth={2} />
        </button>
      </div>

      {/* Stated plainly. The alternative — the form that used to live here —
          collected an address and promised a reply that could never arrive. */}
      <p className="inquiry-form__note">
        We don't have a public contact address yet, so there's no inbox to write
        to. When one exists it will be listed here.
      </p>
    </section>
  );
}
