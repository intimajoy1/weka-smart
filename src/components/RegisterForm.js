import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../App.css';
import SplashScreen from './SplashScreen';

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
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 12 && cleaned.startsWith('254')) return cleaned;
    if ((cleaned.length === 10 || cleaned.length === 9) && (cleaned.startsWith('07') || cleaned.startsWith('01')))
      return '254' + cleaned.substring(1);
    if (cleaned.length === 13 && cleaned.startsWith('254')) return cleaned.substring(1);
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
        amount: "99",
        phone: formatPhoneNumber(formData.phone),
      };

      setResponseMsg(
        "⏳ Processing your request...\n📲 You’ll receive an M-PESA prompt on your phone.\n❗ Enter PIN to complete payment of Ksh 250."
      );
      setShowModal(true);

      const response = await axios.post("https://sandbox.koyeb.app/api/stkPush", payload);

      if (response.data.CheckoutRequestID) {
        setCheckoutRequestID(response.data.CheckoutRequestID);
        setPollingActive(true);
      } else {
        setResponseMsg("STK Push sent. But no ID returned.");
        setShowModal(true);
      }
    } catch (err) {
      console.error(err);
      setResponseMsg("⚠️ Error initiating STK Push.");
      setShowModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!pollingActive || !checkoutRequestID) return;
    let interval = null;
    let attempts = 0;

    const poll = async () => {
      try {
        const res = await axios.get(`https://sandbox.koyeb.app/api/payment-status/${checkoutRequestID}`);
        if (res.data && res.data.status === 'confirmed') {
          setResponseMsg(
            "🎉 You’re In! Welcome Smart Voter.\n✅ Your payment of Ksh 250 has been received.\n🔗 Click below to download your Smart Voter Guide."
          );
          setShowModal(true);
          clearInterval(interval);
          setPollingActive(false);
        }
      } catch (err) {
        console.log("Polling error:", err);
      }

      attempts++;
      if (attempts >= 6) {
        setResponseMsg("⚠️ No confirmation received.\nPlease try again later.");
        setShowModal(true);
        clearInterval(interval);
        setPollingActive(false);
      }
    };

    interval = setInterval(poll, 10000);
    return () => clearInterval(interval);
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
    <input type="tel" name="phone" placeholder="Phone (07..., 011..., or +254...)" onChange={handleChange} required />
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
