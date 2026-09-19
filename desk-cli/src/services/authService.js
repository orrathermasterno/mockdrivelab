const url = import.meta.env.VITE_SERVER_URL;

const registerUser = async (email, password) => {

  try {
    const res = await fetch(`${url}/register`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      console.error('Registration failed');
      return res.json();
    }

    return res.json();
  } catch (err) {
    console.error(err);
  }

};

const loginUser = async (email, password) => {
  try {
    const res = await fetch(`${url}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      console.error('Login failed');
      return res.json();
    }

    return res.json();
  } catch (err) {
    console.error(err) 
  }   
};

export { registerUser, loginUser };