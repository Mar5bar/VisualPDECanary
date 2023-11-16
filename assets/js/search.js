// Load the document list and index from the root directory of the site.

let documents = [];
let pageHeadings = [];
let siteIndex, pageIndex;

async function setupSiteSearch() {
  documents = await getDocs();
  // If there is no index saved in local storage, build one.
  if (
    !localStorage.getItem("index") ||
    localStorage.getItem("index").expiryTime < Date.now()
  ) {
    // Define a function that will skip a pipeline function for a specified field
    var skipField = function (fieldName, fn) {
      return function (token, i, tokens) {
        if (token.metadata["fields"].indexOf(fieldName) >= 0) {
          return token;
        }
        return fn(token, i, tokens);
      };
    };

    const skipStopWordFilter = skipField("title", lunr.stopWordFilter);
    lunr.Pipeline.registerFunction(skipStopWordFilter, "skipStopWordFilter");
    const skipStemmer = skipField("title", lunr.stemmer);
    lunr.Pipeline.registerFunction(skipStemmer, "skipStemmer");

    siteIndex = lunr(function () {
      this.ref("id");
      this.field("title");
      this.field("extract");
      this.field("body");
      this.field("tags");
      this.pipeline.remove(lunr.stopWordFilter);
      this.pipeline.remove(lunr.stemmer);
      this.pipeline.add(skipStopWordFilter);
      this.pipeline.add(skipStemmer);

      documents.forEach(function (doc) {
        this.add(doc);
      }, this);
    });
    siteIndex.expiryTime = Date.now() + 1000 * 60 * 60 * 24 * 1;
    localStorage.setItem("index", JSON.stringify(siteIndex));
  } else {
    siteIndex = lunr.Index.load(JSON.parse(localStorage.getItem("index")));
  }
}
async function getDocs() {
  return fetch("/doclist.json")
    .then((response) => response.json())
    .then((json) => {
      return json;
    });
}

async function setupPageSearch() {
  let counter = 0;
  // Get all h3, h4, h5 tags from the page.
  document.querySelectorAll("h3, h4, h5").forEach((el) => {
    const obj = {};
    obj.ref = counter++;
    obj.id = el.id;
    obj.title = el.innerText;
    pageHeadings.push(obj);
  });
  pageIndex = lunr(function () {
    this.ref("ref");
    this.field("title");

    pageHeadings.forEach(function (doc) {
      this.add(doc);
    }, this);
  });
  console.log(pageIndex);
}

setupSiteSearch();
setupPageSearch();

window.addEventListener("blur", () => {
  document.getElementById("siteSearchResults").style.display = "none";
});

function site_search(term) {
  document.getElementById("siteSearchResults").innerHTML = "<ul></ul>";
  if (term) {
    document.getElementById("siteSearchResults").style.display = "";
    //put results on the screen.
    var searchterm = "";
    term
      .split(" ")
      .filter((e) => e)
      .forEach((str) => {
        str += "*";
        searchterm +=
          "title:" +
          str +
          "^1000 tags:" +
          str +
          " extract:" +
          str +
          "^10 body:" +
          str +
          "^0.0001 ";
      });
    var results = siteIndex.search(searchterm);

    if (results.length > 0) {
      for (var i = 0; i < results.length; i++) {
        // more statements
        var ref = results[i]["ref"];
        var url = documents[ref]["url"];
        var title = documents[ref]["title"];
        var extract = documents[ref]["extract"];
        var img = documents[ref]["img"];
        if (extract) {
          title += /[\?\!\.]/.test(title.trim().slice(-1)) ? " " : ": ";
        }
        var item = document.querySelectorAll("#siteSearchResults ul")[0];
        var html = "";
        html += img ? "<img src='" + img + "'/>" : "";
        html +=
          "<p><span class='title'>" +
          title +
          "</span><span class='body'>" +
          extract +
          "</span></p>";
        item.innerHTML =
          item.innerHTML +
          "<li class='siteSearchResult'><a href='" +
          url +
          "'>" +
          html +
          "</a></li>";
      }
      return results;
    } else {
      document.querySelectorAll("#siteSearchResults ul")[0].innerHTML =
        "<li class='siteSearchResult'>No results found</li>";
    }
  } else {
    document.getElementById("siteSearchResults").style.display = "none";
  }
  return false;
}

function doc_search(term) {
  document.getElementById("docSearchResults").innerHTML = "<ul></ul>";
  if (term) {
    document.getElementById("docSearchResults").style.display = "";
    //put results on the screen.
    var searchterm = "";
    term
      .split(" ")
      .filter((e) => e)
      .forEach((str) => {
        str += "*";
        searchterm += "*" + str;
      });
    var results = pageIndex.search(searchterm);

    if (results.length > 0) {
      for (var i = 0; i < results.length; i++) {
        var ref = results[i]["ref"];
        var id = pageHeadings[ref]["id"];
        var title = pageHeadings[ref]["title"];
        var item = document.querySelectorAll("#docSearchResults ul")[0];
        var html = "";
        html += "<p><span class='title'>" + title + "</span></p>";
        item.innerHTML =
          item.innerHTML +
          `<li class='docSearchResult'><a onclick='document.getElementById("${id}")` +
          ".scrollIntoView();'>" +
          html +
          "</a></li>";
      }
      return results;
    } else {
      document.querySelectorAll("#docSearchResults ul")[0].innerHTML =
        "<li class='docSearchResult'>No results found</li>";
    }
  } else {
    document.getElementById("docSearchResults").style.display = "none";
  }
  return false;
}
