import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../App.css';
import SplashScreen from './SplashScreen';

const API_BASE =
  process.env.REACT_APP_API_BASE?.replace(/\/+$/, '') // strip trailing slash
  || 'https://sandbox.koyeb.app/api/v1/mpesa';        // <-- keep this consistent with your backend mount

const VoteSmart = () => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [responseMsg, setResponseMsg] = useState('');
  const [checkoutRequestID, setCheckoutRequestID] = useState('');
  const [pollingActive, setPollingActive] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const splashTimeout = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(splashTimeout);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const formatPhoneNumber = (phone) => {
    const cleaned = (phone || '').replace(/\D/g, '');
    if (cleaned.startsWith('254') && cleaned.length === 12) return cleaned;
    if ((cleaned.startsWith('07') || cleaned.startsWith('01')) && (cleaned.length === 10 || cleaned.length === 9)) {
      return '254' + cleaned.substring(1);
    }
    if (cleaned.startsWith('+254') && cleaned.length === 13) return cleaned.substring(1);
    // last resort: if already 12 digits but not starting with 254, leave it (backend will likely reject)
    return cleaned;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResponseMsg('');
    setCheckoutRequestID('');
    setPollingActive(false);

    try {
      const payload = {
        amount: "1", // or "99" if that’s your real price
        phone: formatPhoneNumber(formData.phone),
      };

      setResponseMsg(
        "⏳ Processing your request...\n📲 You’ll receive an M-PESA prompt on your phone.\n❗ Enter PIN to complete payment."
      );
      setShowModal(true);

      console.log('[STK] POST', `${API_BASE}/stkPush`, payload);
      const response = await axios.post(`${API_BASE}/stkPush`, payload);
      console.log('[STK] Response:', response.data);

      if (response.data?.CheckoutRequestID) {
        setCheckoutRequestID(response.data.CheckoutRequestID);
        setPollingActive(true);
      } else {
        setResponseMsg("STK Push sent, but no CheckoutRequestID returned. Please try again.");
        setShowModal(true);
      }
    } catch (err) {
      console.error('[STK] Error:', err?.response?.data || err.message);
      setResponseMsg("⚠️ Error initiating STK Push.");
      setShowModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!pollingActive || !checkoutRequestID) return;

    let intervalId = null;
    let attempts = 0;
    const maxAttempts = 12;     // total ~60s if intervalMs=5000
    const intervalMs = 5000;    // poll every 5s

    const poll = async () => {
      attempts += 1;
      console.log(`[POLL] Attempt ${attempts}/${maxAttempts} for ${checkoutRequestID}`);

      try {
        // 1) Ask our DB first
        const statusUrl = `${API_BASE}/payment-status/${checkoutRequestID}`;
        console.log('[POLL] GET', statusUrl);
        const res = await axios.get(statusUrl);
        const status = res.data?.status;

        console.log('[POLL] payment-status ->', res.data);

        if (status === 'confirmed') {
          setResponseMsg(
            "🎉 You’re In! Welcome Smart Voter.\n✅ Your payment has been received.\n🔗 Click below to download your Smart Voter Guide."
          );
          setShowModal(true);
          clearInterval(intervalId);
          setPollingActive(false);
          return;
        }

        if (status === 'failed') {
          setResponseMsg("❌ Payment failed or was cancelled. Please try again.");
          setShowModal(true);
          clearInterval(intervalId);
          setPollingActive(false);
          return;
        }

        // 2) Fallback: periodically query Safaricom directly if still pending/not_found
        if (attempts === 4 || attempts === 8 || attempts === 12) {
          const confirmUrl = `${API_BASE}/confirmPayment/${checkoutRequestID}`;
          console.log('[POLL][FALLBACK] POST', confirmUrl);
          try {
            const q = await axios.post(confirmUrl);
            console.log('[POLL][FALLBACK] confirmPayment ->', q.data);
            const rcRaw =
              q.data?.ResultCode ??
              q.data?.resultCode ??
              q.data?.Body?.stkCallback?.ResultCode ??
              q.data?.Body?.ResultCode;

            const rc = typeof rcRaw === 'string' ? parseInt(rcRaw, 10) : rcRaw;

            if (rc === 0) {
              setResponseMsg(
                "🎉 You’re In! Welcome Smart Voter.\n✅ Your payment has been confirmed (via query).\n🔗 Click below to download your Smart Voter Guide."
              );
              setShowModal(true);
              clearInterval(intervalId);
              setPollingActive(false);
              return;
            }
          } catch (qErr) {
            console.warn('[POLL][FALLBACK] confirmPayment error:', qErr?.response?.data || qErr.message);
          }
        }

        // 3) Stop after max attempts
        if (attempts >= maxAttempts) {
          setResponseMsg("⚠️ No confirmation received.\nPlease try again later.");
          setShowModal(true);
          clearInterval(intervalId);
          setPollingActive(false);
        }
      } catch (err) {
        console.warn('[POLL] Error:', err?.response?.data || err.message);
        if (attempts >= maxAttempts) {
          setResponseMsg("⚠️ No confirmation received.\nPlease try again later.");
          setShowModal(true);
          clearInterval(intervalId);
          setPollingActive(false);
        }
      }
    };

    // start immediately, then every intervalMs
    poll();
    intervalId = setInterval(poll, intervalMs);

    return () => clearInterval(intervalId);
  }, [pollingActive, checkoutRequestID]);

  if (showSplash) return <SplashScreen />;

  return (
    <div className="vote-smart-page">
      {/* NAVBAR */}
      <nav className="navbar">
        <h1>🇰🇪 SmartBallot™</h1>
        <a href="#get-guide">Unlock Now</a>
      </nav>

      {/* HERO */}
      <section className="hero">
        <h1>Don’t Risk Wasting Your Vote</h1>
        <p>
          70% of Kenyans admit making costly mistakes at the ballot.<br />
          With the <strong>SmartBallot™ Checklist</strong>, you’ll be ready in 15 minutes.<br />
          Normal price: <s>Ksh 500</s> • Today only: <span className="highlight">Ksh 99</span>.
        </p>
        <a href="#get-guide">
          <button className="btn">Unlock My SmartBallot™ Now</button>
        </a>
      </section>

      {/* MISTAKES VS SMART */}
      <section className="section-grid">
        <div className="section mistakes">
          <h2>❌ Costly Mistakes</h2>
          <ul>
            <li>Voting emotionally instead of factually</li>
            <li>Spoiling ballot unknowingly</li>
            <li>Selling your vote for handouts</li>
            <li>Regretting choices too late</li>
          </ul>
        </div>
        <div className="section smart">
          <h2>✅ What Smart Voters Do</h2>
          <ul>
            <li>Come prepared with a proven checklist</li>
            <li>Choose based on facts, not tribe</li>
            <li>Protect their vote and future</li>
            <li>Secure their voice with confidence</li>
          </ul>
        </div>
      </section>

      {/* REGISTRATION + PAYMENT */}
      <section id="get-guide" className="section register-section">
        <h2>Instant Access — Just Ksh 99</h2>
        <form onSubmit={handleSubmit} className="register-form">
          <input type="text" name="name" placeholder="Full Name" onChange={handleChange} required />
          <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
          <input type="tel" name="phone" placeholder="Phone (07..., 011..., or 254...)" onChange={handleChange} required />
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Processing..." : "Unlock My SmartBallot™"}
          </button>
        </form>
        <p className="payment-note">🔒 100% Secure Payment via <strong>M-Pesa</strong></p>
      </section>

      {/* SOCIAL PROOF */}
      <section className="section text-center">
        <h2>Trusted by Thousands</h2>
        <p>
          Join <span className="highlight">100,000+ Kenyans</span> who refuse to gamble with their future.
        </p>
        <p className="sub-proof">“It’s the 15 minutes that saved my vote.” — Mary, Nairobi</p>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <p>🇰🇪 SmartBallot™ © {new Date().getFullYear()}</p>
        <p className="footer-quote">Every vote matters. Don’t waste yours. Make it Smart.</p>
      </footer>

      {/* MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            <pre>{responseMsg}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoteSmart;
