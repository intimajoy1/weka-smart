import React, { useContext, useEffect, useState } from "react";
import "./App.css";
import { Context } from "./main";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Register from "./components/RegisterForm";
import { Toaster, toast } from "react-hot-toast";
import axios from "axios";

const App = () => {
  const { isAuthorized, setIsAuthorized, setUser } = useContext(Context);

  // form state for STK push
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [orderId, setOrderId] = useState("");

  // ✅ fetch user on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(
          "https://sandbox.koyeb.app/api/v1/user/getuser",
          { withCredentials: true }
        );
        setUser(response.data.user);
        setIsAuthorized(true);
      } catch (error) {
        setIsAuthorized(false);
      }
    };
    fetchUser();
  }, []); // only run on first mount

const API_BASE =
  process.env.REACT_APP_API_BASE?.replace(/\/+$/, '') ||
  'https://sandbox.koyeb.app/api/v1/mpesa';

const formatPhone = (p) => {
  const c = (p || '').replace(/\D/g, '');
  if (c.startsWith('254') && c.length === 12) return c;
  if ((c.startsWith('07') || c.startsWith('01')) && (c.length === 10 || c.length === 9)) return '254' + c.slice(1);
  if (c.startsWith('+254') && c.length === 13) return c.slice(1);
  return c;
};

const handleSTKPush = async (e) => {
  e.preventDefault();
  try {
    const res = await axios.post(`${API_BASE}/stkPush`, {
      amount,
      phone: formatPhone(phone),
      Order_ID: orderId, // optional
    });
    console.log("STK Response:", res.data);
    toast.success("STK Push initiated! Check your phone.");
  } catch (error) {
    console.error("STK Push Error:", error.response?.data || error.message);
    toast.error("Failed to initiate STK Push");
  }
};


  return (
    <>
      {!isAuthorized ? (
        <Register />
      ) : (
        <div className="stk-form">
          <h1>Welcome back!</h1>
          <form onSubmit={handleSTKPush}>
            <div>
              <label>Amount:</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div>
              <label>Phone (254...):</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div>
              <label>Order ID:</label>
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                required
              />
            </div>
            <button type="submit">Pay with M-Pesa</button>
          </form>
        </div>
      )}
      <Toaster />
    </>
  );
};

export default App;
