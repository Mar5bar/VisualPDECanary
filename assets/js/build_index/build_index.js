var fs = require("fs"),
  fm = require("front-matter");
var path = require("path");
var jsdom = require("jsdom");
var { JSDOM } = jsdom;
const { document } = new JSDOM(`<!DOCTYPE html>`).window;

try {
  // Loop through all the markdown files in the site.
  let docs = [];
  counter = 0;
  var files = getFiles("../../../").filter(
    (fn) =>
      fn.endsWith(".md") &&
      !fn.endsWith("parser.md") &&
      !fn.endsWith("demos.md") &&
      !fn.endsWith("index.md") &&
      !fn.includes("_demos/"),
  );
  files.forEach((file) => {
    // Read the file and extract the front matter.
    var content = fs.readFileSync(file, "utf8");
    var matter = fm(content);
    if (matter.attributes.hasOwnProperty("title")) {
      if (matter.attributes?.published != false) {
        const obj = matter.attributes;
        obj.body = minify(matter.body);
        const parsedPath = path.parse(file.slice(2));
        obj.url =
          parsedPath.dir.replaceAll(/\/_/g, "/") + "/" + parsedPath.name;
        obj.url = path.normalize(obj.url);
        obj.tags = obj.categories || "";
        obj.extract = obj.extract ? minify(obj.extract) : "";
        obj.equation = obj.equation ? minify(obj.equation) : "";
        obj.img = obj.thumbnail || "";
        obj.id = counter++;
        docs.push(obj);
      }
    }
  });
  // Write docs to disk.
  fs.writeFileSync("../../../doclist.json", JSON.stringify(docs));
  // Write a doclist to disk that doesn't include the body of the document.
  docs.forEach((doc) => {
    delete doc.body;
  });
  fs.writeFileSync("../../../doclist_frontmatter.json", JSON.stringify(docs));
} catch (error) {}

// Recursive function to get files
function getFiles(dir, files = []) {
  // Get an array of all files and directories in the passed directory using fs.readdirSync
  const fileList = fs.readdirSync(dir);
  // Create the full path of the file/directory by concatenating the passed directory and file/directory name
  for (const file of fileList) {
    const name = `${dir}/${file}`;
    // Check if the current file/directory is a directory using fs.statSync
    if (fs.statSync(name).isDirectory()) {
      // If it is a directory, recursively call the getFiles function with the directory path and the files array
      getFiles(name, files);
    } else {
      // If it is a file, push the full path to the files array
      files.push(name);
    }
  }
  return files;
}

// Strip HTML tags and content from a string.
function stripHTML(content) {
  let div = document.createElement("div");
  div.innerHTML = content;
  let textContent = div.textContent || div.innerText || "";
  div.remove();
  return textContent;
}

function minify(content) {
  content = stripHTML(content);
  content = content.replace(/\s+/g, " ");
  // content = content.replaceAll(/\$\$[^\$]+\$\$/g, "");
  // content = content.replaceAll(/\$[^\$]+\$/g, "");
  // content = content.replaceAll(/\[([^\]]+)\]\([^\)]+\)/g, "$1");
  // content = content.replaceAll(/\{\{[^\}]+\}\}/g, "");
  // content = content.replaceAll(/[\#\*→]/g, "");
  content = content.replaceAll(/\s+/g, " ");
  return content;
}
