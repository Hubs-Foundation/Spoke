import test from "ava";
import Project from "../../../src/client/api/Project";

const fileUrl = "https://hubs.local:9090/api/files/directory/file.png";
const fileUrlWithQS = "https://hubs.local:9090/api/files/directory/file.png?size=large";
const directoryUrl = "https://hubs.local:9090/api/files/directory/";
const directoryWithoutSlash = "https://hubs.local:9090/api/files/directory";
const directoryUrlWithQS = "https://hubs.local:9090/api/files/directory?hello=world";

// project.getUrlDirname

test("project.getUrlDirname on url with file extension", t => {
  const project = new Project();
  t.is(project.getUrlDirname(fileUrl), "/api/files/directory");
});

test("project.getUrlDirname on url with file extension and query string", t => {
  const project = new Project();
  t.is(project.getUrlDirname(fileUrlWithQS), "/api/files/directory");
});

test("project.getUrlDirname on url with trailing slash", t => {
  const project = new Project();
  t.is(project.getUrlDirname(directoryUrl), "/api/files/directory");
});

test("project.getUrlDirname on url without trailing slash", t => {
  const project = new Project();
  t.is(project.getUrlDirname(directoryWithoutSlash), "/api/files/directory");
});

test("project.getUrlDirname on url with query string", t => {
  const project = new Project();
  t.is(project.getUrlDirname(directoryUrlWithQS), "/api/files/directory");
});

// project.getUrlBasename

test("project.getUrlBasename on url with file extension", t => {
  const project = new Project();
  t.is(project.getUrlBasename(fileUrl), "file.png");
});

test("project.getUrlBasename on url with file extension and query string", t => {
  const project = new Project();
  t.is(project.getUrlBasename(fileUrlWithQS), "file.png");
});

test("project.getUrlBasename on url with trailing slash", t => {
  const project = new Project();
  t.is(project.getUrlBasename(directoryUrl), "directory");
});

test("project.getUrlBasename on url without trailing slash", t => {
  const project = new Project();
  t.is(project.getUrlBasename(directoryWithoutSlash), "directory");
});

test("project.getUrlBasename on url with query string", t => {
  const project = new Project();
  t.is(project.getUrlBasename(directoryUrlWithQS), "directory");
});

// project.getUrlFilename

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

// project.getUrlExtname

test("project.getUrlExtname on url with file extension", t => {
  const project = new Project();
  t.is(project.getUrlExtname(fileUrl), ".png");
});

test("project.getUrlExtname on url with file extension and query string", t => {
  const project = new Project();
  t.is(project.getUrlExtname(fileUrlWithQS), ".png");
});

test("project.getUrlExtname on url with trailing slash", t => {
  const project = new Project();
  t.is(project.getUrlExtname(directoryUrl), null);
});

test("project.getUrlExtname on url without trailing slash", t => {
  const project = new Project();
  t.is(project.getUrlExtname(directoryWithoutSlash), null);
});

test("project.getUrlExtname on url with query string", t => {
  const project = new Project();
  t.is(project.getUrlExtname(directoryUrlWithQS), null);
});
