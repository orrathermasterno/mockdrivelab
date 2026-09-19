import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router';
import { useContext } from 'react';
import { ProfileContext, ProfileProvider } from "./contexts/Context.jsx";
import Main from "./components/Main.jsx";
import FileManager from "./components/FileManager.jsx";

  function RequireAuth({ children }) {
    const { user } = useContext(ProfileContext);
    
    if (!user) {
      return <Navigate to="/" replace />;
    }
    
    return children;
  }

  function RequireGuest({ children }) {
    const { user } = useContext(ProfileContext);
    
    if (user) {
      return <Navigate to="/files" replace />;
    }
    
    return children;
  }

function App() {
  return (
    <Router>
      <ProfileProvider>
        <Routes>
          <Route 
            path='/' 
            element={
              <RequireGuest>
                <Main />
              </RequireGuest>
            } 
          />

          <Route 
            path='/files' 
            element={
              <RequireAuth>
                <FileManager />
              </RequireAuth>
            } 
          />
        </Routes>
      </ProfileProvider>
    </Router>
  );
}

export default App;