let documents = await loadDocs();

// Exclude user guide and topic pages from search results.
let pages = documents
  .filter((doc) => doc.layout === "page")
  .filter((doc) => doc.url.indexOf("/user-guide/") === -1);

// Build the list of related posts, prioritising any specified in the frontmatter.
// A related post is defined as one sharing categories with the current post. We'll sort by number of shared categories.
// Store the current path without .html at the end.
let path = window.location.pathname;
if (path.endsWith(".html")) {
  path = path.slice(0, -5);
}
let currentPost = pages.find((doc) => doc.url === path);
let relatedPosts = [];
if (currentPost && currentPost.categories) {
  relatedPosts = pages
    .map((doc) => {
      let sharedCats =
        doc.categories.filter((cat) => currentPost.categories.includes(cat)) ||
        [];
      return { doc, sharedCats };
    })
    .filter((post) => post.sharedCats.length > 0 && post.doc.url != path)
    .sort((a, b) => b.sharedCats.length - a.sharedCats.length)
    .map((post) => post.doc);
}

// If there are specified related posts, add them to the beginning of the list by sorting by inclusion in related_posts.
relatedPosts = relatedPosts.sort((a, b) => {
  if (window.specifiedRelatedPosts.includes(a.url)) {
    return -1;
  } else if (window.specifiedRelatedPosts.includes(b.url)) {
    return 1;
  } else {
    return 0;
  }
});

// Assign the content to the post of the week section.
let posts = document.getElementsByClassName("related_post");
let index = 0;
for (let post of posts) {
  if (index >= relatedPosts.length) {
    break;
  }
  let relatedPost = relatedPosts[index];
  post.href = relatedPost.url;
  post.getElementsByClassName("topic_banner")[0].style.backgroundImage =
    "url('" + relatedPost.img + "')";
  post.getElementsByClassName("title")[0].textContent = relatedPost.title;
  post.getElementsByClassName("subtitle")[0].textContent = relatedPost.extract;
  post.classList.remove("hiddenPost");
  index++;
}

// Make the post visible if a post was added.
if (index > 0) {
  let container = document.getElementById("related_posts-container");
  container.classList.remove("hiddenPost");
  document
    .getElementById("related_posts_wrapper")
    .classList.remove("hiddenPost");
}
