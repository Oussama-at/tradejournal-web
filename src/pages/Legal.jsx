import BrandLogo from '../components/BrandLogo';
import React from 'react';
import { useNavigate } from 'react-router-dom';

// Public legal pages: Terms & Conditions and Privacy Policy.
// Linked from the landing footer and required (checkbox) at account creation.
// NOTE: This is a solid, plain-language baseline tailored to a trading-journal
// SaaS. Have it reviewed by a lawyer for your jurisdiction before relying on it.

const CONTACT_EMAIL = 'ousssatt@gmail.com';
const WHATSAPP = '+212 635 925 986';
const LAST_UPDATED = 'June 2026';

const ST = {
  page: { minHeight: '100vh', background: '#0a0e14', color: '#e8edf3', padding: '40px 18px 80px' },
  wrap: { maxWidth: 820, margin: '0 auto' },
  top: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 24, flexWrap: 'wrap' },
  logo: { display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' },
  logoBox: { width: 38, height: 38, borderRadius: 10, background: '#00e676', color: '#06210f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 },
  logoText: { fontWeight: 800, fontSize: 16 },
  backBtn: { padding: '8px 14px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.18)', background: 'transparent', color: 'inherit', cursor: 'pointer', fontWeight: 600 },
  title: { fontSize: 28, fontWeight: 800, marginBottom: 4 },
  updated: { opacity: 0.6, fontSize: 13, marginBottom: 24 },
  h2: { fontSize: 18, fontWeight: 700, margin: '26px 0 8px', color: '#fff' },
  p: { lineHeight: 1.7, opacity: 0.88, marginBottom: 10, fontSize: 15 },
  li: { lineHeight: 1.7, opacity: 0.88, marginBottom: 6, fontSize: 15 },
  callout: { marginTop: 18, padding: '14px 16px', borderRadius: 12, background: 'rgba(0,230,118,0.06)', border: '1px solid rgba(0,230,118,0.2)', lineHeight: 1.6, fontSize: 14 },
  warn: { marginTop: 18, padding: '14px 16px', borderRadius: 12, background: 'rgba(243,156,18,0.07)', border: '1px solid rgba(243,156,18,0.28)', lineHeight: 1.6, fontSize: 14 },
  footerLink: { color: '#00e676', cursor: 'pointer', textDecoration: 'underline' },
};

function LegalLayout({ title, children }) {
  const navigate = useNavigate();
  return (
    <div style={ST.page}>
      <div style={ST.wrap}>
        <div style={ST.top}>
          <div style={ST.logo} onClick={() => navigate('/')}>
            <div style={ST.logoBox}><BrandLogo /></div>
            <span style={ST.logoText}>TradeJournal PRO</span>
          </div>
          <button style={ST.backBtn} onClick={() => navigate('/')}>{'\u2190'} Home</button>
        </div>
        <h1 style={ST.title}>{title}</h1>
        <div style={ST.updated}>Last updated: {LAST_UPDATED}</div>
        {children}
      </div>
    </div>
  );
}

export function Terms() {
  const navigate = useNavigate();
  return (
    <LegalLayout title="Terms & Conditions">
      <p style={ST.p}>
        These Terms & Conditions ("Terms") govern your access to and use of TradeJournal PRO
        (the "Service"), operated by TradeJournal PRO ("we", "us", "our"). By creating an
        account, subscribing, or using the Service, you agree to be bound by these Terms. If
        you do not agree, do not use the Service.
      </p>

      <div style={ST.warn}>
        <strong>Not financial advice.</strong> TradeJournal PRO is a personal trade-journaling
        and analytics tool. Nothing in the Service is investment, financial, legal, or tax
        advice. Trading financial instruments involves substantial risk of loss. You are solely
        responsible for your own trading decisions and outcomes.
      </div>

      <h2 style={ST.h2}>1. Eligibility</h2>
      <p style={ST.p}>You must be at least 18 years old and legally able to enter a contract to use the Service.</p>

      <h2 style={ST.h2}>2. Accounts & credentials</h2>
      <ul>
        <li style={ST.li}>You are responsible for keeping your username and password confidential.</li>
        <li style={ST.li}>You are responsible for all activity that occurs under your account.</li>
        <li style={ST.li}>Accounts are personal. You may not share, resell, or transfer your account or credentials.</li>
        <li style={ST.li}>Notify us immediately of any unauthorized use of your account.</li>
      </ul>

      <h2 style={ST.h2}>3. Subscriptions & plans</h2>
      <ul>
        <li style={ST.li}>We offer a free 24-hour trial and paid plans (including 6-month, 1-year, and Lifetime).</li>
        <li style={ST.li}>The free trial provides full access for a limited time and then expires automatically.</li>
        <li style={ST.li}>A "Lifetime" plan means access for the operational lifetime of the Service; it does not guarantee perpetual operation if the Service is discontinued.</li>
        <li style={ST.li}>Access to paid features requires an active, paid subscription in good standing.</li>
      </ul>

      <h2 style={ST.h2}>4. Payments</h2>
      <ul>
        <li style={ST.li}>Prices are displayed at checkout and may be shown in DH (MAD) or USD equivalents.</li>
        <li style={ST.li}>We accept manual, card, PayPal, and cryptocurrency (BTC, USDT-TRC20, ETH) payments through the channels shown in the app.</li>
        <li style={ST.li}>For crypto and manual payments, access is granted after we confirm receipt of funds. You are responsible for sending the correct amount on the correct network; funds sent on the wrong network may be lost.</li>
        <li style={ST.li}>You are responsible for any taxes, network/transaction fees, and currency-conversion costs.</li>
      </ul>

      <h2 style={ST.h2}>5. Refunds</h2>
      <p style={ST.p}>
        Because the Service grants immediate digital access, payments are generally
        non-refundable once access has been provided, except where a refund is required by
        applicable law. The free trial lets you evaluate the Service before paying. Refund
        requests can be sent to {CONTACT_EMAIL} and are reviewed case by case at our discretion.
      </p>

      <h2 style={ST.h2}>6. Suspension, expiry & termination</h2>
      <ul>
        <li style={ST.li}>Subscriptions may be <strong>active</strong>, <strong>expired</strong>, or <strong>suspended</strong>. A suspended subscription temporarily loses access while remaining on record.</li>
        <li style={ST.li}>We may suspend, revoke, or terminate access (including paid or Lifetime access) without refund if you breach these Terms, abuse the Service, attempt fraud or chargebacks, or share/resell your account.</li>
        <li style={ST.li}>You may stop using the Service at any time.</li>
      </ul>

      <h2 style={ST.h2}>7. Acceptable use</h2>
      <ul>
        <li style={ST.li}>Do not reverse engineer, scrape, attack, overload, or attempt to gain unauthorized access to the Service or other users' data.</li>
        <li style={ST.li}>Do not upload unlawful content or use the Service for unlawful purposes.</li>
        <li style={ST.li}>Do not resell, sublicense, or commercially redistribute the Service without our written permission.</li>
      </ul>

      <h2 style={ST.h2}>8. Your content & data ownership</h2>
      <p style={ST.p}>
        Your trades, logs, notes, and capital records ("Your Data") remain yours. You grant us a
        limited license to store and process Your Data solely to operate and improve the Service
        for you. How we handle Your Data is described in our Privacy Policy.
      </p>

      <h2 style={ST.h2}>9. Intellectual property</h2>
      <p style={ST.p}>
        The Service, including its software, design, branding, and content (excluding Your Data),
        is owned by us and protected by law. We grant you a limited, non-exclusive,
        non-transferable right to use the Service while your subscription is active.
      </p>

      <h2 style={ST.h2}>10. Disclaimers & limitation of liability</h2>
      <p style={ST.p}>
        The Service is provided "as is" and "as available" without warranties of any kind. We do
        not guarantee uninterrupted, error-free, or loss-free operation. To the maximum extent
        permitted by law, we are not liable for any trading losses, lost profits, or indirect,
        incidental, or consequential damages. Our total liability for any claim relating to the
        Service shall not exceed the amount you paid us in the 12 months before the claim.
      </p>

      <h2 style={ST.h2}>11. Changes to the Service or Terms</h2>
      <p style={ST.p}>
        We may update the Service and these Terms. Material changes will be reflected by the
        "Last updated" date. Continued use after changes means you accept the updated Terms.
      </p>

      <h2 style={ST.h2}>12. Governing law & contact</h2>
      <p style={ST.p}>
        These Terms are governed by the laws of Morocco, without regard to conflict-of-law rules.
        Questions: {CONTACT_EMAIL} or WhatsApp {WHATSAPP}.
      </p>

      <div style={ST.callout}>
        See also our <span style={ST.footerLink} onClick={() => navigate('/privacy')}>Privacy Policy</span>.
      </div>
    </LegalLayout>
  );
}

export function Privacy() {
  const navigate = useNavigate();
  return (
    <LegalLayout title="Privacy Policy">
      <p style={ST.p}>
        This Privacy Policy explains what data TradeJournal PRO collects, how we use it, and how
        we protect it. We aim to collect the minimum needed to run the Service.
      </p>

      <h2 style={ST.h2}>1. Data we collect</h2>
      <ul>
        <li style={ST.li}><strong>Account data:</strong> email address, username, password (stored hashed), and optional profile photo.</li>
        <li style={ST.li}><strong>Your trading data:</strong> the trades, markets, entry/exit points, amounts, sessions, capital, withdrawals, and notes you choose to record.</li>
        <li style={ST.li}><strong>Subscription & payment status:</strong> plan, status (active/suspended/expired), and payment method used (we do <em>not</em> store full card numbers).</li>
        <li style={ST.li}><strong>Technical data:</strong> a device identifier, session tokens, activity/audit logs, and cookies needed for login and security.</li>
      </ul>

      <h2 style={ST.h2}>2. How we use your data</h2>
      <ul>
        <li style={ST.li}>To provide your dashboard, journal, analytics, and ranking features.</li>
        <li style={ST.li}>To authenticate you, secure your account, and prevent abuse or fraud.</li>
        <li style={ST.li}>To manage subscriptions, payments, and account communications (e.g. sending your login credentials).</li>
        <li style={ST.li}>To improve and troubleshoot the Service.</li>
      </ul>

      <h2 style={ST.h2}>3. Security of your logs & trades</h2>
      <ul>
        <li style={ST.li}>Data is transmitted over encrypted HTTPS connections.</li>
        <li style={ST.li}>Passwords are stored using one-way hashing; we cannot see your plain password.</li>
        <li style={ST.li}>Access to your trades and logs is restricted to your authenticated account; administrators access data only as needed to operate the Service.</li>
        <li style={ST.li}>We keep activity logs to detect unauthorized access.</li>
        <li style={ST.li}>No system is perfectly secure; you also help protect your data by keeping your credentials private.</li>
      </ul>

      <h2 style={ST.h2}>4. Cookies & consent</h2>
      <p style={ST.p}>
        We use essential cookies/local storage for login sessions and preferences, and we ask for
        your consent for non-essential cookies via the cookie banner. You can change your choice
        at any time.
      </p>

      <h2 style={ST.h2}>5. Sharing</h2>
      <p style={ST.p}>
        We do not sell your personal data. We share data only with service providers needed to
        run the Service (e.g. hosting, email delivery, payment processors), or when required by
        law. Your private trading data is never shared publicly. The leaderboard, when enabled,
        displays only limited aggregate metrics and is shown to administrators.
      </p>

      <h2 style={ST.h2}>6. Data retention</h2>
      <p style={ST.p}>
        We keep your data while your account is active and as needed to comply with legal,
        accounting, or security obligations. You can request deletion (see below).
      </p>

      <h2 style={ST.h2}>7. Your rights</h2>
      <ul>
        <li style={ST.li}>Access, correct, or export your data.</li>
        <li style={ST.li}>Request deletion of your account and associated data.</li>
        <li style={ST.li}>Withdraw cookie consent for non-essential cookies.</li>
      </ul>
      <p style={ST.p}>To exercise these rights, contact {CONTACT_EMAIL}.</p>

      <h2 style={ST.h2}>8. Account credentials & email</h2>
      <p style={ST.p}>
        When you register, we send your login credentials to the email you provide. Please keep
        that email secure and delete the message after first login. If you don't receive it,
        check your spam folder and contact us.
      </p>

      <h2 style={ST.h2}>9. Children</h2>
      <p style={ST.p}>The Service is not intended for anyone under 18.</p>

      <h2 style={ST.h2}>10. Changes & contact</h2>
      <p style={ST.p}>
        We may update this policy; the "Last updated" date reflects the latest version. Questions:
        {' '}{CONTACT_EMAIL} or WhatsApp {WHATSAPP}.
      </p>

      <div style={ST.callout}>
        See also our <span style={ST.footerLink} onClick={() => navigate('/terms')}>Terms & Conditions</span>.
      </div>
    </LegalLayout>
  );
}

export default Terms;
