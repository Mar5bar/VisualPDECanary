const useDark = window.matchMedia("(prefers-color-scheme: dark)");
function safeDarkModeModify(callback) {
  if (!localStorage.getItem("darkModeBeingModified")) {
    localStorage.setItem("darkModeBeingModified", "true");
    callback();
    localStorage.removeItem("darkModeBeingModified");
  }
}
function toggleDarkMode(state, save) {
  document.documentElement.classList.toggle("dark-mode", state);
  const themeColor = state ? "#171b29" : "#dfdfdf";
  document
    .querySelector('meta[name="theme-color"]')
    .setAttribute("content", themeColor);
  // If another script is modifying dark mode, do not save changes.
  if (save && !localStorage.getItem("darkModeBeingModified")) {
    // Save the preference with a timestamp, using a lock.
    safeDarkModeModify(() => {
      localStorage.setItem("dark-mode", state);
      localStorage.setItem("dark-mode-save-time", new Date());
    });
  }
}
// When loading initially, check if the preference is older than 24 hours.
if (localStorage.hasOwnProperty("dark-mode-save-time")) {
  const now = new Date();
  const then = new Date(localStorage.getItem("dark-mode-save-time"));
  const diff = now - then;
  // If the last save was more than 24 hours ago, remove the preference.
  if (diff > 86400000) {
    safeDarkModeModify(() => {
      localStorage.removeItem("dark-mode");
      localStorage.removeItem("dark-mode-save-time");
    });
  }
} else {
  // Remove the preference if no save time is found.
  safeDarkModeModify(() => {
    localStorage.removeItem("dark-mode");
  });
}
// Restore the saved preference if it exists.
if (localStorage.hasOwnProperty("dark-mode")) {
  toggleDarkMode(localStorage.getItem("dark-mode") == "true");
} else {
  toggleDarkMode(useDark.matches);
  safeDarkModeModify(() => {
    localStorage.setItem("dark-mode", useDark.matches);
  });
}
// Listen for the changes in the OS settings, and remove preference on change.
useDark.addEventListener("change", (evt) => {
  toggleDarkMode(evt.matches);
  safeDarkModeModify(() => {
    localStorage.removeItem("dark-mode");
  });
});
