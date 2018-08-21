import test from "ava";
import { getUrlDirname, getUrlBasename, getUrlFilename, getUrlExtname } from "../../../src/client/utils/url-path";

const fileUrl = "https://hubs.local:9090/api/files/directory/file.png";
const fileUrlWithQS = "https://hubs.local:9090/api/files/directory/file.png?size=large";
const directoryUrl = "https://hubs.local:9090/api/files/directory/";
const directoryWithoutSlash = "https://hubs.local:9090/api/files/directory";
const directoryUrlWithQS = "https://hubs.local:9090/api/files/directory?hello=world";

// getUrlDirname

test("getUrlDirname on url with file extension", t => {
  t.is(getUrlDirname(fileUrl), "/api/files/directory");
});

test("getUrlDirname on url with file extension and query string", t => {
  t.is(getUrlDirname(fileUrlWithQS), "/api/files/directory");
});

test("getUrlDirname on url with trailing slash", t => {
  t.is(getUrlDirname(directoryUrl), "/api/files/directory");
});

test("getUrlDirname on url without trailing slash", t => {
  t.is(getUrlDirname(directoryWithoutSlash), "/api/files/directory");
});

test("getUrlDirname on url with query string", t => {
  t.is(getUrlDirname(directoryUrlWithQS), "/api/files/directory");
});

// getUrlBasename

test("getUrlBasename on url with file extension", t => {
  t.is(getUrlBasename(fileUrl), "file.png");
});

test("getUrlBasename on url with file extension and query string", t => {
  t.is(getUrlBasename(fileUrlWithQS), "file.png");
});

test("getUrlBasename on url with trailing slash", t => {
  t.is(getUrlBasename(directoryUrl), "directory");
});

test("getUrlBasename on url without trailing slash", t => {
  t.is(getUrlBasename(directoryWithoutSlash), "directory");
});

test("getUrlBasename on url with query string", t => {
  t.is(getUrlBasename(directoryUrlWithQS), "directory");
});

// getUrlFilename

test("getUrlFilename on url with file extension", t => {
  t.is(getUrlFilename(fileUrl), "file");
});

test("getUrlFilename on url with file extension and query string", t => {
  t.is(getUrlFilename(fileUrlWithQS), "file");
});

test("getUrlFilename on url with trailing slash", t => {
  t.is(getUrlFilename(directoryUrl), "directory");
});

test("getUrlFilename on url without trailing slash", t => {
  t.is(getUrlFilename(directoryWithoutSlash), "directory");
});

test("getUrlFilename on url with query string", t => {
  t.is(getUrlFilename(directoryUrlWithQS), "directory");
});

// getUrlExtname

test("getUrlExtname on url with file extension", t => {
  t.is(getUrlExtname(fileUrl), ".png");
});

test("getUrlExtname on url with file extension and query string", t => {
  t.is(getUrlExtname(fileUrlWithQS), ".png");
});

test("getUrlExtname on url with trailing slash", t => {
  t.is(getUrlExtname(directoryUrl), null);
});

test("getUrlExtname on url without trailing slash", t => {
  t.is(getUrlExtname(directoryWithoutSlash), null);
});

test("getUrlExtname on url with query string", t => {
  t.is(getUrlExtname(directoryUrlWithQS), null);
});
