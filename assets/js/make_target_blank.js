document.querySelectorAll("a[href^='/sim/']").forEach((a) => {
  a.setAttribute("target", "_blank");
});
