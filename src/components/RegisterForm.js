import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../App.css';
import SplashScreen from './SplashScreen';

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    occupation: '',
    email: '',
    phone: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [responseMsg, setResponseMsg] = useState('');
  const [checkoutRequestID, setCheckoutRequestID] = useState('');
  const [pollingActive, setPollingActive] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const splashTimeout = setTimeout(() => {
      setShowSplash(false);
    }, 3500);
    return () => clearTimeout(splashTimeout);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
        amount: "1",
        phone: formatPhoneNumber(formData.phone),
      };

      setResponseMsg(`⏳ Processing your registration...\n📲 You’ll receive an MPESA prompt on your phone.\n❗Enter your PIN to complete payment of Ksh 249.`);
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
      setResponseMsg("Error initiating STK Push.");
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
          setResponseMsg(`🎉 You’re In! Welcome to WekaSmart.\n✅ Your payment of Ksh 249 has been received.\n🔗 Click below to get started.`);
          setShowModal(true);
          clearInterval(interval);
          setPollingActive(false);
        }
      } catch (err) {
        console.log("Polling error:", err);
      }

      attempts++;
      if (attempts >= 6) {
        setResponseMsg(`⚠️ No confirmation received.\nPlease try again after a few minutes.`);
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
    <div className="register-page">
      <div className="register-container">
        <h1 className="register-heading">
            💼 Want to Make Extra Cash with Your Phone? 📱
        </h1>
        <p className="register-subtext">
          Join a supportive community of Kenyans who are making money online the legit way.
          Get started for just <span>Ksh 249 </span> and start earning up to <span className="highlight">Ksh 18,600/month </span>
          doing simple online tasks — no tech skills needed.
        </p>

        <form onSubmit={handleSubmit} className="register-form">
          <input type="text" name="name" placeholder="Full Name" onChange={handleChange} required />
          <input type="text" name="occupation" placeholder="Occupation" onChange={handleChange} required />
          <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
          <input type="tel" name="phone" placeholder="Phone (07..., 011..., or +254...)" onChange={handleChange} required />
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <span>Processing...</span>
                <span className="spinner"></span>
              </>
            ) : (
              "Join Now for Ksh 249 Only"
            )}
          </button>
        </form>

        <div className="register-note">
          <p>
            You're not alone. Many Kenyans are now earning real income online with just their phones.
            Don't let fear or lack of support hold you back. This is your moment. 🔓
          </p>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content responsive-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            <pre>{responseMsg}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterForm;
