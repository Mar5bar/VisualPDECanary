(function () {
  let prog = document.getElementById("reading-progress");
  let gutter = document.getElementById("reading-progress-gutter");
  let body = document.body,
    html = document.documentElement;

  const setProgress = () => {
    let height = Math.max(
      body.scrollHeight,
      body.offsetHeight,
      html.clientHeight,
      html.scrollHeight,
      html.offsetHeight,
    );
    if (height <= 2 * html.clientHeight || height <= 0) {
      prog.style.display = "none";
      prog.style.width = "0%";
      gutter.style.display = "none";
      return;
    }
    height = height - html.clientHeight;
    prog.style.display = "block";
    gutter.style.display = "block";
    let scrollFromTop = html.scrollTop || body.scrollTop;
    let width = (scrollFromTop / height) * 100 + "%";

    prog.style.width = width;
  };

  window.addEventListener("scroll", setProgress);
  window.addEventListener("resize", setProgress);
  window.addEventListener("load", setProgress);
})();
