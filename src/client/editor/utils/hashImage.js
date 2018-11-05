function getImageData(img) {
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

export default async function hashImage(img) {
  const imageData = getImageData(img);
  const digest = await crypto.subtle.digest("SHA-256", imageData.data);
  const hashArray = Array.from(new Uint8Array(digest));
  return hashArray.map(b => ("00" + b.toString(16)).slice(-2)).join("");
}
