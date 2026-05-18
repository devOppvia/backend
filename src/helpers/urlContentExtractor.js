const puppeteer = require("puppeteer");
const axios = require("axios");

const MAX_CONTENT_PER_PAGE = 3000;
const MAX_PAGES = 8;
const MAX_TOTAL_CONTENT = 20000;

async function extractContentFromUrl(url) {
  try {
    new URL(url);
  } catch {
    return { content: "", title: "", success: false, error: "Invalid URL format" };
  }

  const origin = new URL(url).origin;
  const visited = new Set([normalizeUrl(url)]);
  const pages = [];

  // Fetch main page and collect nav/header/footer links
  const mainResult = await fetchPageData(url, true);
  if (!mainResult.success) {
    return { content: "", title: "", success: false, error: mainResult.error };
  }

  pages.push({ title: mainResult.title, content: mainResult.content });

  // Resolve nav/footer links to absolute same-origin URLs, deduplicated
  const navLinks = (mainResult.links || [])
    .map((href) => resolveUrl(href, url))
    .filter(Boolean)
    .filter((u) => {
      try {
        return new URL(u).origin === origin;
      } catch {
        return false;
      }
    })
    .filter((u) => {
      const norm = normalizeUrl(u);
      if (visited.has(norm)) return false;
      visited.add(norm);
      return true;
    })
    .slice(0, MAX_PAGES - 1);

  // Crawl each nav/footer page
  for (const link of navLinks) {
    if (pages.length >= MAX_PAGES) break;
    try {
      const result = await fetchPageData(link, false);
      if (result.success && result.content.length > 50) {
        pages.push({ title: result.title || link, content: result.content });
      }
    } catch {
      // skip pages that fail
    }
  }

  const combined = pages
    .map((p) => `### ${p.title || "Page"}\n\n${p.content}`)
    .join("\n\n---\n\n");

  const content =
    combined.length > MAX_TOTAL_CONTENT
      ? combined.slice(0, MAX_TOTAL_CONTENT) + "..."
      : combined;

  return {
    content,
    title: mainResult.title,
    success: true,
    pagesExtracted: pages.length,
  };
}

async function fetchPageData(url, extractLinks) {
  try {
    const result = await fetchWithAxios(url, extractLinks);
    if (result.success) return result;
  } catch {
    // fall through to puppeteer
  }
  return fetchWithPuppeteer(url, extractLinks);
}

async function fetchWithAxios(url, extractLinks) {
  const response = await axios.get(url, {
    timeout: 10000,
    headers: { "User-Agent": "Mozilla/5.0 (compatible; Oppvia-Bot/1.0)" },
    maxContentLength: 2 * 1024 * 1024,
  });

  const html = response.data;
  if (typeof html !== "string") throw new Error("Non-HTML response");

  const { title, text, links } = parseHtml(html, extractLinks);
  const content = truncate(text);

  if (content.length < 100) throw new Error("Insufficient content from static fetch");

  return { content, title, links: links || [], success: true };
}

async function fetchWithPuppeteer(url, extractLinks) {
  let browser;
  try {
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

    page.on("request", (req) => {
      if (["image", "media", "font", "stylesheet"].includes(req.resourceType())) req.abort();
      else req.continue();
    });

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });

    const result = await page.evaluate((shouldExtractLinks) => {
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

      let links = [];
      if (shouldExtractLinks) {
        const anchors = document.querySelectorAll(
          "nav a[href], header a[href], footer a[href]"
        );
        links = Array.from(anchors)
          .map((a) => a.getAttribute("href"))
          .filter(
            (h) =>
              h &&
              !h.startsWith("#") &&
              !h.startsWith("javascript:") &&
              !h.startsWith("mailto:") &&
              !h.startsWith("tel:")
          );
      }

      return { title, text: chunks.join(" "), links };
    }, extractLinks);

    return {
      content: truncate(result.text),
      title: result.title,
      links: result.links || [],
      success: true,
    };
  } catch (err) {
    return { content: "", title: "", links: [], success: false, error: err.message };
  } finally {
    if (browser) await browser.close();
  }
}

function parseHtml(html, extractLinks) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/&[a-z]+;/gi, " ").trim() : "";

  const links = extractLinks ? extractNavFooterLinks(html) : [];

  const text = html
    .replace(/<(script|style|noscript|iframe|svg|head)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  return { title, text, links };
}

function extractNavFooterLinks(html) {
  const links = new Set();
  const sectionPattern = /<(nav|header|footer)[^>]*>([\s\S]*?)<\/\1>/gi;
  let sectionMatch;

  while ((sectionMatch = sectionPattern.exec(html)) !== null) {
    const sectionHtml = sectionMatch[2];
    const hrefPattern = /href=["']([^"']*?)["']/gi;
    let hrefMatch;
    while ((hrefMatch = hrefPattern.exec(sectionHtml)) !== null) {
      const href = hrefMatch[1];
      if (
        href &&
        !href.startsWith("#") &&
        !href.startsWith("javascript:") &&
        !href.startsWith("mailto:") &&
        !href.startsWith("tel:")
      ) {
        links.add(href);
      }
    }
  }

  return Array.from(links);
}

function resolveUrl(href, base) {
  try {
    return new URL(href, base).href;
  } catch {
    return null;
  }
}

function normalizeUrl(url) {
  try {
    const u = new URL(url);
    u.hash = "";
    return u.href.replace(/\/$/, "");
  } catch {
    return url;
  }
}

function truncate(text) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  return cleaned.length > MAX_CONTENT_PER_PAGE
    ? cleaned.slice(0, MAX_CONTENT_PER_PAGE) + "..."
    : cleaned;
}

module.exports = { extractContentFromUrl };
