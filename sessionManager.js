/**
 * SessionManager handles login state purely via localStorage.
 * It waits briefly for token/username to appear after login/signup.
 */

const SessionManager = (() => {
  const TOKEN_KEY = 'token';
  const USERNAME_KEY = 'username';

  // Wait for token/username to appear in localStorage (optional)
  function waitForSession(timeout = 500) {
    return new Promise(resolve => {
      const interval = setInterval(() => {
        const token = localStorage.getItem(TOKEN_KEY);
        const username = localStorage.getItem(USERNAME_KEY);
        if (token && username) {
          clearInterval(interval);
          resolve({ loggedIn: true, username, token });
        }
      }, 50);

      setTimeout(() => {
        clearInterval(interval);
        const token = localStorage.getItem(TOKEN_KEY);
        const username = localStorage.getItem(USERNAME_KEY);
        if (token && username) {
          resolve({ loggedIn: true, username, token });
        } else {
          resolve({ loggedIn: false });
        }
      }, timeout);
    });
  }

  // Check if user is logged in
  async function isLoggedIn() {
    const session = await waitForSession();
    if (!session.loggedIn) return false;

    // Optional: check token expiration (assuming JWT-like payload)
    try {
      const payloadB64 = session.token.split('.')[0];
      const payload = JSON.parse(atob(payloadB64));
      if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
        logout(); // token expired
        return false;
      }
    } catch {
      return false;
    }

    return true;
  }

  // Get current username
  function getUsername() {
    return localStorage.getItem(USERNAME_KEY) || null;
  }

  // Logout user
  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
  }

  // Get token
  function getToken() {
    return localStorage.getItem(TOKEN_KEY) || null;
  }

  return {
    waitForSession,
    isLoggedIn,
    getUsername,
    getToken,
    logout,
  };
})();

// Export for modules
export default SessionManager;
