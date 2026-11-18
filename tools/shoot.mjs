/**
 * Скриншоты страницы через headless Chrome + DevTools Protocol.
 * Нужен только для проверки вёрстки, в репозиторий сайта не входит по смыслу.
 *
 *   node tools/shoot.mjs
 */
import { spawn } from 'node:child_process';
import { mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const OUT = path.resolve('tools/shots');
const PROFILE = path.resolve('tools/.chrome-profile');
const PORT = 9333;
const BASE = process.env.SITE_URL || 'http://127.0.0.1:8765/';

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => existsSync(p));

if (!CHROME) {
  console.error('Не найден Chrome/Edge');
  process.exit(1);
}

await mkdir(OUT, { recursive: true });

const chrome = spawn(CHROME, [
  '--headless=new',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-gpu',
  '--hide-scrollbars',
  '--disable-extensions',
  `--user-data-dir=${PROFILE}`,
  `--remote-debugging-port=${PORT}`,
  'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForDevtools() {
  for (let i = 0; i < 100; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (res.ok) return (await res.json()).webSocketDebuggerUrl;
    } catch {}
    await sleep(150);
  }
  throw new Error('DevTools не поднялся');
}

const browserWs = await waitForDevtools();

// Открываем вкладку
const tab = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json();

const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => {
  ws.addEventListener('open', res, { once: true });
  ws.addEventListener('error', rej, { once: true });
});

let msgId = 0;
const pending = new Map();
const events = new Map();

ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
    return;
  }
  if (msg.method && events.has(msg.method)) {
    events.get(msg.method).forEach((fn) => fn(msg.params));
    events.delete(msg.method);
  }
});

function send(method, params = {}) {
  const id = ++msgId;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

function once(method, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('таймаут ' + method)), timeout);
    const list = events.get(method) || [];
    list.push((params) => { clearTimeout(timer); resolve(params); });
    events.set(method, list);
  });
}

await send('Page.enable');
await send('Runtime.enable');

async function setViewport(width, height, mobile = false, scale = 1) {
  await send('Emulation.setDeviceMetricsOverride', {
    width, height, deviceScaleFactor: scale, mobile,
    screenWidth: width, screenHeight: height,
  });
  await send('Emulation.setTouchEmulationEnabled', { enabled: mobile });
}

async function goto(url) {
  const loaded = once('Page.loadEventFired');
  await send('Page.navigate', { url });
  await loaded;
  await sleep(1400); // появление hero-анимаций и рендер сетки
}

async function evaluate(expression) {
  const res = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  return res.result?.value;
}

async function capture(name) {
  const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  const { writeFile } = await import('node:fs/promises');
  await writeFile(path.join(OUT, name + '.png'), Buffer.from(data, 'base64'));
  console.log('✓', name);
}

async function scrollTo(selector, offset = 0) {
  await evaluate(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return null;
    const y = el.getBoundingClientRect().top + window.scrollY + ${offset};
    window.scrollTo(0, y);
    return y;
  })()`);
  await sleep(1100);
}

async function fullPage(name) {
  // Склеиваем страницу из экранных срезов: 100svh-герой не даёт снять «всю страницу» одним кадром.
  const { writeFile } = await import('node:fs/promises');
  const total = await evaluate('document.documentElement.scrollHeight');
  const step = 900;
  const slices = [];
  await evaluate(`(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    const st = document.createElement('style');
    st.id = 'shoot-hide-header';
    st.textContent = '.header{display:none!important}';
    document.head.appendChild(st);
  })()`);

  // прогрев: даём всем lazy-картинкам загрузиться и отрисоваться
  await evaluate(`(async () => {
    const h = document.documentElement.scrollHeight;
    for (let y = 0; y < h; y += 700) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); }
    window.scrollTo(0, h);
    await new Promise(r => setTimeout(r, 600));
    await Promise.all([...document.images].map(img => img.complete ? null : new Promise(r => { img.onload = img.onerror = r; })));
    window.scrollTo(0, 0);
  })()`);
  await sleep(1200);

  for (let y = 0; y < total; y += step) {
    await evaluate(`window.scrollTo(0, ${y})`);
    await sleep(900);
    const realY = await evaluate('window.scrollY');
    const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    const file = path.join(OUT, `slice-${String(slices.length).padStart(2, '0')}.png`);
    await writeFile(file, Buffer.from(data, 'base64'));
    slices.push({ file, y: realY });
  }

  await evaluate(`document.querySelector('#shoot-hide-header')?.remove()`);
  await writeFile(path.join(OUT, 'slices.json'), JSON.stringify({ slices, total, step }, null, 2));
  console.log('✓ срезы для склейки:', slices.length);
}

// ---------------- десктоп ----------------
await setViewport(1440, 900);
await goto(BASE);
await capture('01-hero');
await scrollTo('#works', -70);
await capture('02-works');
await scrollTo('#films', -70);
await capture('03-films');
await scrollTo('#about', -70);
await capture('04-about');
await scrollTo('#services', -70);
await capture('05-services');
await scrollTo('#contact', -70);
await capture('06-contact');

// карточка видео: модалка
await scrollTo('#films', -70);
await evaluate(`document.querySelector('#films-list .film__btn').click()`);
await sleep(900);
await capture('07-video-modal');
await evaluate(`document.querySelector('#vm-close').click()`);
await sleep(400);

// лайтбокс
await scrollTo('#works', -70);
await evaluate(`document.querySelector('#grid .card__btn').click()`);
await sleep(1100);
await capture('08-lightbox');
await evaluate(`document.querySelector('#lb-close').click()`);
await sleep(300);

// мобильное меню
await setViewport(390, 844, true, 2);
await goto(BASE);
await sleep(500);
await evaluate(`document.querySelector('#burger').click()`);
await sleep(700);
await capture('09-mobile-menu');
await evaluate(`document.querySelector('#burger').click()`);
await sleep(400);
await capture('10-mobile-hero');

// ---------------- мобилка ----------------
await scrollTo('#works', -70);
await capture('11-mobile-works');
await scrollTo('#films', -70);
await capture('12-mobile-films');
await scrollTo('#about', -70);
await capture('13-mobile-about');
await scrollTo('#contact', -70);
await capture('14-mobile-contact');

// полный лист для общего взгляда
await setViewport(1440, 900);
await goto(BASE);
await sleep(300);
await fullPage('15-full');

ws.close();
chrome.kill();
await sleep(500);
try { await rm(PROFILE, { recursive: true, force: true }); } catch {}
console.log('Готово:', OUT);
