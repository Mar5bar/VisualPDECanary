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
