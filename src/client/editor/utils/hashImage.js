import getImageData from "./getImageData";

export default async function hashImage(img) {
  const imageData = getImageData(img);
  const digest = await crypto.subtle.digest("SHA-256", imageData.data);
  const hashArray = Array.from(new Uint8Array(digest));
  return hashArray.map(b => ("00" + b.toString(16)).slice(-2)).join("");
}
