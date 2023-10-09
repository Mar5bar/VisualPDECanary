var fs = require("fs"),
  fm = require("front-matter");
var path = require("path");

try {
  // Loop through all the markdown files in the site.
  let docs = [];
  counter = 0;
  var files = getFiles("../../../").filter((fn) => fn.endsWith(".md"));
  files.forEach((file) => {
    // Read the file and extract the front matter.
    var content = fs.readFileSync(file, "utf8");
    var matter = fm(content);
    if (matter.attributes.hasOwnProperty("title")) {
      if (matter.attributes?.published != false) {
        const obj = matter.attributes;
        obj.body = matter.body;
        const parsedPath = path.parse(file.slice(2));
        obj.url = parsedPath.dir.replaceAll(/\/_/g,"/") + "/" + parsedPath.name;
        obj.url = path.normalize(obj.url);
        obj.tags = obj.tags || "";
        obj.extract = obj.extract || "";
        obj.img = obj.thumbnail || "";
        obj.id = counter++;
        docs.push(obj);
      }
    }
  });
  // Write docs to disk.
  fs.writeFileSync("../../../doclist.json", JSON.stringify(docs));
  // console.log(docs);
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
