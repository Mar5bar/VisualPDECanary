const useDark = window.matchMedia("(prefers-color-scheme: dark)");
function toggleDarkMode(state, save) {
  document.documentElement.classList.toggle("dark-mode", state);
  if (save) {
    localStorage.setItem("dark-mode", state);
    localStorage.setItem("dark-mode-save-time", new Date());
  }
  const themeColor = state ? "#171b29" : "#dfdfdf";
  document
    .querySelector('meta[name="theme-color"]')
    .setAttribute("content", themeColor);
}
if (localStorage.hasOwnProperty("dark-mode-save-time")) {
  const now = new Date();
  const then = new Date(localStorage.getItem("dark-mode-save-time"));
  const diff = now - then;
  // If the last save was more than 24 hours ago, remove the preference.
  if (diff > 86400000) {
    localStorage.removeItem("dark-mode");
    localStorage.removeItem("dark-mode-save-time");
  }
} else {
  // Remove the preference if no save time is found.
  localStorage.removeItem("dark-mode");
}
if (localStorage.hasOwnProperty("dark-mode")) {
  toggleDarkMode(localStorage.getItem("dark-mode") == "true");
} else {
  toggleDarkMode(useDark.matches)
  localStorage.setItem("dark-mode", useDark.matches);
}
// Listen for the changes in the OS settings, and remove preference on change.
useDark.addEventListener("change", (evt) => {
  toggleDarkMode(evt.matches);
  localStorage.removeItem("dark-mode");
});
