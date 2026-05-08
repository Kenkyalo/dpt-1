// auth-check.js — include in every protected page AFTER config.js
// <script src="config.js"></script>
// <script src="auth-check.js"></script>
// Redirects to index.html if no active session.
// Sets window.currentUser for the page to use.

(async function () {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) {
    window.location.href = 'index.html';
    return;
  }
  window.currentUser = session.user;

  // Listen for sign-out anywhere
  sb.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') window.location.href = 'index.html';
  });
})();

// Convenience logout function usable by any page
async function logout() {
  await sb.auth.signOut();
  window.location.href = 'index.html';
}
