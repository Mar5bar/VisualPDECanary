document.addEventListener("DOMContentLoaded", function () {
  TableOfContents();
});

function TableOfContents(container, output) {
  var toc = "";
  var level = 0;
  const maxLevel = 4;
  var topLevel = Infinity;
  var container =
    document.querySelector(container) ||
    document.querySelector("#contents") ||
    document.querySelector(".post-content");
  var output = output || "#toc";
  if (!container || !document.querySelector(output)) {
    return;
  }

  const dummy = container.innerHTML.replace(
    /<h([\d])\s*(?:id=("[\w\-]+"))?>([^<]+)(.*)<\/h([\d])>/gi,
    function (str, openLevel, id, titleText, otherContent, closeLevel) {
      if (openLevel != closeLevel) {
        return str;
      }

      if (openLevel > maxLevel) {
        return str;
      }

      if (openLevel < topLevel) {
        topLevel = openLevel;
        level = topLevel - 1;
      }

      if (openLevel > level) {
        toc += new Array(openLevel - level + 1).join("<ul>");
      } else if (openLevel < level) {
        toc += new Array(level - openLevel + 1).join("</li></ul>");
        if (openLevel == topLevel) {
          toc += "</details>";
        }
      } else {
        toc += new Array(level + 1).join("</li>");
      }

      level = parseInt(openLevel);

      if (level == topLevel) {
        // If we're at the top level, make this a summary item.
        toc += `<li><details><summary>${titleText}</summary>`;
      } else {
        toc +=
          `<li><a onclick=document.getElementById(${id})?.scrollIntoView({behaviour:"smooth"});>` +
          titleText +
          "</a>";
      }

      return "";
    }
  );

  if (level) {
    toc += new Array(level + 1).join("</ul>");
  }
  document.querySelector(output || "#toc").innerHTML += toc;
}
