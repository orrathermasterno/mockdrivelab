import { createContext, useState, useEffect } from "react";
import { jwtDecode } from 'jwt-decode';

export const ProfileContext = createContext();

export const ProfileProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        
        if (decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem('token');
          return '';
        }
        
        return { email: decoded.email }; 
      } catch (err) {
        localStorage.removeItem('token');
        return '';
      }
    }
    return '';
  });

  const login = (token) => {
    localStorage.setItem('token', token);
    const decoded = jwtDecode(token);
    setUser({ email: decoded.id }); 
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser('');
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && user) {
      const decoded = jwtDecode(token);
      const timeUntilExpiry = (decoded.exp * 1000) - Date.now();

      if (timeUntilExpiry <= 0) {
        logout();
      } else {
        const timer = setTimeout(() => {
          alert("Your session has expired. Please log in again.");
          logout();
        }, timeUntilExpiry);

        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  const value = { user, login, logout };

  return (
    <ProfileContext.Provider value={ value }>
      { children }
    </ProfileContext.Provider>
  );
};