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

// Exclude user guide and topic pages from search results.
let pages = documents
  .filter((doc) => doc.layout === "page")
  .filter((doc) => doc.url.indexOf("/user-guide/") === -1);

// Get the number of days since a fixed baseline date.
const now = new Date();
const baseline = new Date(2024, 0, 1);
const days = Math.ceil(
  (now.getTime() - baseline.getTime()) / 86400000 + baseline.getDay() + 1,
);

// Generate the post of the day. Note that adding new posts to the site will likely change the post of the week.
// Assign the content to the post of the week section.
let posts = document.getElementsByClassName("post-of-the-week");
let index = 0;
for (let post of posts) {
  let postOfTheWeek = pages[(days + index) % pages.length];
  post.href = postOfTheWeek.url;
  post.getElementsByClassName("topic_banner")[0].style.backgroundImage =
  "url('" + postOfTheWeek.img + "')";
  post.getElementsByClassName("title")[0].textContent = postOfTheWeek.title;
  post.getElementsByClassName("subtitle")[0].textContent = postOfTheWeek.extract;
  index++;
}

// Make the post visible.
let container = document.getElementById("post-of-the-week-container");
container.classList.remove("hiddenPost");
