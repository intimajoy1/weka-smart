import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
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
        amount: "10",
        phone: formatPhoneNumber(formData.phone),
      };

      const response = await axios.post("https://sandbox.koyeb.app/api/stkPush", payload);
      if (response.data.CheckoutRequestID) {
        setCheckoutRequestID(response.data.CheckoutRequestID);
        setResponseMsg("STK Push sent. Awaiting confirmation...");
        setPollingActive(true);
      } else {
        setResponseMsg("STK Push sent. But no ID returned.");
      }

    } catch (err) {
      console.error(err);
      setResponseMsg("Error initiating STK Push.");
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
          setResponseMsg("✅ You have successfully registered. Our team will contact you via email shortly");
          clearInterval(interval);
          setPollingActive(false);
        }
      } catch (err) {
        console.log("Polling error:", err);
      }

      attempts++;
      if (attempts >= 6) {
        setResponseMsg("⚠️ No confirmation received. Please try again after few minutes.");
        clearInterval(interval);
        setPollingActive(false);
      }
    };

    interval = setInterval(poll, 10000);
    return () => clearInterval(interval);
  }, [pollingActive, checkoutRequestID]);

return (
  <div className="register-page">
    <div className="register-container">
      <h1 className="register-heading">
        Break Free Financially With Just Your Phone 📱
      </h1>
      <p className="register-subtext">
        Join a supportive community of Kenyans who are making money online the legit way.
        Get started for just <span>Ksh 249</span> and start earning up to <span className="highlight">Ksh 18,600/month </span>
         doing simple online tasks — no tech skills needed.
      </p>

      <form onSubmit={handleSubmit} className="register-form">
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="occupation"
          placeholder="Occupation"
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          onChange={handleChange}
          required
        />
        <input
          type="tel"
          name="phone"
          placeholder="Phone (07..., 011..., or +254...)"
          onChange={handleChange}
          required
        />

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Processing..." : "Join Now for Ksh 249 Only"}
        </button>
      </form>

      {responseMsg && (
        <div className="response-message">
          {responseMsg}
        </div>
      )}

      <div className="register-note">
        <p>
          You're not alone. Many Kenyans are now earning real income online with just their phones.
          Don't let fear or lack of support hold you back. This is your moment. 🔓
        </p>
      </div>
    </div>
  </div>
);

};

export default RegisterForm;
