// If the document is long, add in a fading scroll-to-top button.
if ($(document).height() > 2 * $(window).height()) {
  const scrollToTopButton = document.createElement("a");
  scrollToTopButton.id = "top-link";
  scrollToTopButton.innerHTML = '<i class="fa-solid fa-circle-arrow-up"></i>';
  scrollToTopButton.href = "#";
  scrollToTopButton.onclick = "scroll(0,0);";
  document.body.appendChild(scrollToTopButton);

  window.onscroll = function () {
    if ($(document).scrollTop() < 20) {
      $(scrollToTopButton).fadeOut();
    } else if (!$(scrollToTopButton).is(":visible")) {
      $(scrollToTopButton).css("display", "flex").hide().fadeIn();
    }
  };
}
