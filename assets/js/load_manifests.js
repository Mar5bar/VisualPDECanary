async function getDocs() {
  return fetch("/doclist.json")
    .then((response) => response.json())
    .then((json) => {
      return json;
    });
}

async function getFrontmatter() {
  return fetch("/doclist_frontmatter.json")
    .then((response) => response.json())
    .then((json) => {
      return json;
    });
}

async function loadDocs() {
  // Build the list of pages to display.
  let documents;
  if (
    !localStorage.getItem("documents") ||
    !localStorage.getItem("documentsExpiryTime") ||
    parseInt(localStorage.getItem("documentsExpiryTime")) < Date.now()
  ) {
    documents = await getDocs();
    localStorage.setItem(
      "documentsExpiryTime",
      Date.now() + 1000 * 60 * 60 * 24 * 1,
    );
    localStorage.setItem("documents", JSON.stringify(documents));
  } else {
    documents = JSON.parse(localStorage.getItem("documents"));
  }
  return documents;
}