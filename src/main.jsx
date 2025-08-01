import React, { createContext, useState } from "react";
import App from "./App.js";

export const Context = createContext({
  isAuthorized: false,
});

export const AppWrapper = () => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [user, setUser] = useState({});

  return (
    <Context.Provider
      value={{
        isAuthorized,
        setIsAuthorized,
        user,
        setUser,
      }}
    >
      <App />
    </Context.Provider>
  );
};
