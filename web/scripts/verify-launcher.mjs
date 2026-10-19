import puppeteer from "puppeteer-core";

const browser = await puppeteer.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none"],
  defaultViewport: { width: 360, height: 800, deviceScaleFactor: 2 },
});
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text().slice(0, 200));
});
await page.evaluateOnNewDocument(() => {
  localStorage.setItem(
    "iphone17-settings",
    JSON.stringify({ state: { bootAnimation: false, demoNotifications: false, lang: "id", sounds: false, haptics: false, volume: 0.7, brightness: 1, wallpaper: "cosmic" }, version: 0 }),
  );
});
await page.goto("http://localhost:4174/?mock", { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 1400));

const shot = (name) => page.screenshot({ path: `/tmp/opencode/shots-launcher/${name}.png` });

const clickDot = async (i) => {
  await page.evaluate((idx) => {
    const dotsWrap = [...document.querySelectorAll("div")].find((d) => d.style.bottom === "172px" && d.style.justifyContent === "center");
    const dot = dotsWrap?.children[idx];
    dot?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  }, i);
  await new Promise((r) => setTimeout(r, 700));
};

await clickDot(0);
await shot("01-widgets");
await clickDot(1);
await shot("02-apps");
await clickDot(2);
await shot("03-apps2");
await clickDot(3);
await shot("04-library");

await clickDot(1);
const opened = await page.evaluate(() => {
  const span = [...document.querySelectorAll("span")].find((e) => e.textContent === "iOS");
  const target = span?.parentElement?.querySelector("div");
  target?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerId: 1, clientX: 100, clientY: 120 }));
  target?.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 1 }));
  target?.click();
  return !!target;
});
await new Promise((r) => setTimeout(r, 900));
await shot("05-folder");

const searchClicked = await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find((x) => x.textContent?.includes("Cari"));
  b?.click();
  return !!b;
});
if (searchClicked) {
  await new Promise((r) => setTimeout(r, 500));
  await page.keyboard.type("what", { delay: 25 });
  await new Promise((r) => setTimeout(r, 500));
  await shot("06-spotlight");
}

console.log("folder opened:", opened, "| spotlight:", searchClicked);
console.log(errors.length ? `ERRORS: ${errors.join(" | ")}` : "no errors");
await browser.close();
