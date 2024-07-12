function fetch_retry(url, n) {
  return fetch(url).catch(function (error) {
    if (n === 1) throw error;
    return fetch_retry(url, n - 1);
  });
}

async function getDocs() {
  return fetch_retry("/doclist.json", 10)
    .then((response) => response.json())
    .then((json) => {
      return json;
    });
}

async function getFrontmatter() {
  return fetch_retry("/doclist_frontmatter.json", 10)
    .then((response) => response.json())
    .then((json) => {
      return json;
    });
}

async function loadDocs() {
  // Build the list of pages to display.
  return await getDocs();
}
