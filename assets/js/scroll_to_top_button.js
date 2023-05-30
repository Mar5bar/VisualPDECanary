// If the document is long, add in a fading scroll-to-top button.
if ($(document).height() > 2 * $(window).height()) {
  const scrollToTopButton = document.createElement("a");
  scrollToTopButton.classList.add("top-link");
  scrollToTopButton.innerHTML = '<i class="fa-solid fa-circle-arrow-up"></i>';
  scrollToTopButton.style = "hidden";
  scrollToTopButton.href = "#";
  scrollToTopButton.onclick = "scroll(0,0);";
  document.body.appendChild(scrollToTopButton);
}
