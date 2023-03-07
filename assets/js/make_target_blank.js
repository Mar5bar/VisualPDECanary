$("a")
  .filter(function () {
    return /\/sim/.test(this.href);
  })
  .attr("target", "_blank");
