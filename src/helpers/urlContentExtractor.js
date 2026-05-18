const puppeteer = require("puppeteer");
const axios = require("axios");

const MAX_CONTENT_LENGTH = 4000;

// Tags whose inner text is noise — skip them entirely
const SKIP_TAGS = new Set(["script", "style", "noscript", "iframe", "svg", "img", "video", "audio", "head"]);

/**
 * Extracts visible text from a URL.
 * Tries a lightweight axios fetch first; falls back to puppeteer for JS-heavy pages.
 *
 * @param {string} url
 * @returns {Promise<{ content: string, title: string, success: boolean, error?: string }>}
 */
async function extractContentFromUrl(url) {
  try {
    new URL(url); // validate URL format
  } catch {
    return { content: "", title: "", success: false, error: "Invalid URL format" };
  }

  // Try fast path first (no JS rendering needed)
  try {
    const result = await fetchWithAxios(url);
    if (result.success) return result;
  } catch {
    // fall through to puppeteer
  }

  // Fall back to puppeteer for JS-heavy / SPA pages
  return fetchWithPuppeteer(url);
}

async function fetchWithAxios(url) {
  const response = await axios.get(url, {
    timeout: 10000,
    headers: { "User-Agent": "Mozilla/5.0 (compatible; Oppvia-Bot/1.0)" },
    maxContentLength: 2 * 1024 * 1024, // 2 MB cap
  });

  const html = response.data;
  if (typeof html !== "string") throw new Error("Non-HTML response");

  const { title, text } = parseHtml(html);
  const content = truncate(text);

  if (content.length < 100) throw new Error("Insufficient content from static fetch");

  return { content, title, success: true };
}

async function fetchWithPuppeteer(url) {
  let browser;
  try {
    // browser = await puppeteer.launch({
    //   headless: true,
    //   args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    // });

     browser = await puppeteer.launch({
       executablePath: "/usr/bin/google-chrome",
       headless: true,
       args: [
         "--no-sandbox",
         "--disable-setuid-sandbox",
         "--disable-dev-shm-usage",
         "--disable-gpu",
       ],
     });
    
  

    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (compatible; Oppvia-Bot/1.0)");
    await page.setRequestInterception(true);

    // Block images/fonts/media to speed up load
    page.on("request", (req) => {
      const type = req.resourceType();
      if (["image", "media", "font", "stylesheet"].includes(type)) req.abort();
      else req.continue();
    });

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });

    const { title, text } = await page.evaluate(() => {
      const title = document.title || "";

      const skip = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "IFRAME", "SVG", "IMG", "VIDEO", "AUDIO", "HEAD"]);
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          let el = node.parentElement;
          while (el) {
            if (skip.has(el.tagName)) return NodeFilter.FILTER_REJECT;
            el = el.parentElement;
          }
          return NodeFilter.FILTER_ACCEPT;
        },
      });

      const chunks = [];
      let node;
      while ((node = walker.nextNode())) {
        const val = node.nodeValue.trim();
        if (val.length > 1) chunks.push(val);
      }

      return { title, text: chunks.join(" ") };
    });

    return { content: truncate(text), title, success: true };
  } catch (err) {
    return { content: "", title: "", success: false, error: err.message };
  } finally {
    if (browser) await browser.close();
  }
}


// Minimal HTML → plain text parser (regex-based, no external deps)
function parseHtml(html) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/&[a-z]+;/gi, " ").trim() : "";

  let text = html
    .replace(/<(script|style|noscript|iframe|svg|head)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  return { title, text };
}

function truncate(text) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  return cleaned.length > MAX_CONTENT_LENGTH ? cleaned.slice(0, MAX_CONTENT_LENGTH) + "..." : cleaned;
}

module.exports = { extractContentFromUrl };
