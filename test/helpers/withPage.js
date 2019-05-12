import puppeteer from "puppeteer-core";
import getChrome from "get-chrome";

export default function withPage(path, timeout = 60000) {
  const url = new URL(path, "https://localhost:9091");
  const chromePath = process.env.CHROME_PATH || getChrome();

  return async (t, run) => {
    const browser = await puppeteer.launch({
      headless: false,
      executablePath: chromePath,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--ignore-gpu-blacklist", "--ignore-certificate-errors"]
    });

    const page = await browser.newPage();

    try {
      await page.goto(url.href, { timeout });
      await run(t, page);
    } finally {
      await page.close();
      await browser.close();
    }
  };
}
