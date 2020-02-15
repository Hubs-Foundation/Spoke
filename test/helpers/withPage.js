import puppeteer from "puppeteer-core";
import locateChrome from "locate-chrome";

const chromePromise = process.env.CHROME_PATH ? Promise.resolve(process.env.CHROME_PATH) : locateChrome();

export default function withPage(path, timeout = 60000) {
  const url = new URL(path, "https://hubs.local:9090");

  return async (t, run) => {
    const chromePath = await chromePromise;
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
