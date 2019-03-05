import test from "ava";
import Project from "../../../../src/client/api/Project";

const fileUrl = "https://hubs.local:9090/api/files/directory/file.png";
const fileUrlWithQS = "https://hubs.local:9090/api/files/directory/file.png?size=large";
const directoryUrl = "https://hubs.local:9090/api/files/directory/";
const directoryWithoutSlash = "https://hubs.local:9090/api/files/directory";
const directoryUrlWithQS = "https://hubs.local:9090/api/files/directory?hello=world";

test("project.getUrlFilename on url with file extension", t => {
  const project = new Project();
  t.is(project.getUrlFilename(fileUrl), "file");
});

test("project.getUrlFilename on url with file extension and query string", t => {
  const project = new Project();
  t.is(project.getUrlFilename(fileUrlWithQS), "file");
});

test("project.getUrlFilename on url with trailing slash", t => {
  const project = new Project();
  t.is(project.getUrlFilename(directoryUrl), "directory");
});

test("project.getUrlFilename on url without trailing slash", t => {
  const project = new Project();
  t.is(project.getUrlFilename(directoryWithoutSlash), "directory");
});

test("project.getUrlFilename on url with query string", t => {
  const project = new Project();
  t.is(project.getUrlFilename(directoryUrlWithQS), "directory");
});
