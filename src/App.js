import React, { useContext, useEffect } from "react";
import "./App.css";
import { Context } from "./main";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Register from './components/RegisterForm'
import { Toaster } from "react-hot-toast";
import axios from "axios";



const App = () => {
  const { isAuthorized, setIsAuthorized, setUser } = useContext(Context);
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
}, []);  // ← Only run on first mount


 return (
    <>
      {/* Render your content directly instead of routes */}
      {!isAuthorized ? <Register /> : <h1>Welcome back!</h1>}
      <Toaster />
    </>
  );
};

export default App;