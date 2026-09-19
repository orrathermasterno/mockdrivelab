import React from 'react';
import { useState, useContext } from 'react';
import { useNavigate } from 'react-router';
import { ProfileContext } from '../contexts/Context.jsx';
import Form from './Form.jsx';
import { registerUser, loginUser } from '../services/authService.js';
import '../css/auth.css'

export default function Main() {
  const { login } = useContext(ProfileContext);

  const navigate = useNavigate();

  const [ email, setEmail ] = useState('');
  const [ password, setPassword ] = useState('');

  const [ data, setData ] = useState('');
  const [ err, setErr ] = useState(null);

  const [ isLoginMode, setLoginMode ] = useState(true);

  const submitBtnText = isLoginMode ? 'Login' : 'Sign up';
  const toggleBtnText = isLoginMode ? 'Sign up' : 'Login';
  const modeText = isLoginMode ? 'No account yet?' : 'Already have an account?';

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const calledFunction = isLoginMode ? loginUser : registerUser;
      const result = await calledFunction(email, password);

      setData(result);

      if (result.token) {
        login(result.token);
        navigate('/files'); 
      }
    } catch (err) {
      console.log(err);
      setErr(err);
    }
  };

  const handleSignUpText = () => {
    setLoginMode(prev => !prev);
  };

  const handleEmailInput = (e) => {
    setEmail(e.target.value);
  };

  const handlePasswordInput = (e) => {
    setPassword(e.target.value);
  };

  return (
    <>
    {data.message && (
            <div className={data.success ? 'status ok-status' : 'status error-status'}>
              {data.message}
            </div>
    )}

      <Form
        handleSubmit={handleSubmit}
        handleEmailInput={handleEmailInput}
        handlePasswordInput={handlePasswordInput}
        email={email}
        password={password}
        isLoginMode={isLoginMode}
        submitBtnText={submitBtnText}
      />

      <div className="signup-wrapper">
        <p>{modeText}</p>
        <button onClick={handleSignUpText} className="login-btn signup-btn">
          {toggleBtnText}
        </button>
      </div>
    </>
  );
}
