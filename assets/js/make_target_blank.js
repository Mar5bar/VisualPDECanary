if (!window.matchMedia("(display-mode: standalone)").matches) {
  document.querySelectorAll("a[href^='/sim/']").forEach((a) => {
    a.setAttribute("target", "_blank");
  });
}
