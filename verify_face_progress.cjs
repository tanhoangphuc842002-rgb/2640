const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

(async () => {
  const browser = await chromium.launch({ executablePath: process.argv[2], headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.clock.install();
    const notice = page.locator('#library-notice');
    const progress = page.getByRole('progressbar', { name: 'Đang chuyển mặt đồng hồ' });
    const apply = page.locator('#library-apply');
    async function setup(kind) {
      await page.goto(pathToFileURL(path.join(__dirname, 'index.html')).href);
      await page.evaluate(async kind => {
        let response, release, mode = 1, status = 0, writes = 0, requested;
        const server = { connected: true };
        const characteristic = {
          writeValueWithResponse: async data => {
            const a = Array.from(data), [family, group, op, seq] = a;
            if (family === 0xa8 && group === 0x48 && op === 0) {
              const b = new Uint8Array(18);
              b.set([family,group,op,seq,0,kind==='sensor56'?56:55,1,1]);
              const v = new DataView(b.buffer);
              v.setUint32(11,AHT55Bundle.crc,true);
              v.setUint16(15,AHT55Bundle.size,true);
              response = v;
              return;
            }
            if (family === 16 || (family === 0xe9 && op === 1)) {
              writes++;
              requested=family===16?a[9]:a[8];
              await new Promise(r => { release = r; });
              if (family === 16) return;
              mode = a[8];
              status = 1;
            }
            if (group !== 0x42) return;
            const length = family === 0xe9 && op === 0 ? 9 : op === 3 ? 7 : op === 35 ? 14 : op === 0 ? 20 : 6;
            const b = new Uint8Array(length);
            b.set([family, group, op, seq, 0]);
            if (family === 0xe9 && op === 0) b.set([109, 4, 0x26, 2], 5);
            if (family === 0xe9 && op === 3) b.set([status, mode], 5);
            const v = new DataView(b.buffer);
            if (family === 0xe8 && op === 0) {
              b[5] = b[6] = b[18] = 1;
              b[19] = 180;
              v.setUint32(12, Font420Bundle.crc32, true);
            }
            if (op === 35) {
              v.setUint32(6, Font420Features.bold109.auxLength, true);
              v.setUint32(10, Font420Features.bold109.auxCrc, true);
            }
            response = v;
          },
          readValue: async () => response,
        };
        gattServer = server;
        epdService = { getCharacteristic: async () => characteristic };
        bleDevice = { name: 'C26_TEST' };
        if (kind === 'flash' && !await Flash420.attach(epdService, server)) throw Error('Flash not attached');
        if (kind.startsWith('sensor') && !await AHT48.attach(epdService,server)) throw Error('AHT30 not attached');
        etagFnEnable(true);
        EpdLibrary.refresh();
        window.releaseMode = () => release?.();
        window.modeReady = () => !!release;
        window.endDraw = error => { status = error ? 2 : 0; };
        window.cutLink = () => { server.connected = false; disconnect(); };
        window.modeWrites = () => writes;
        window.requestedMode = () => requested;
      }, kind);
      const face = kind === 'flash' ? 'f2' : kind === 'sensor56' ? 'clock9' : kind === 'sensor' ? 'clock6' : 'clock';
      if(kind==='sensor')assert.equal(await page.locator('[data-face="clock9"]').count(),0);
      await page.locator('#library-grid [data-face="' + face + '"]').click();
      if(kind==='sensor56')await page.waitForFunction(()=>document.querySelector('[data-face="clock9"] img')?.naturalWidth===400);
      await apply.click();
      await page.waitForFunction(() => window.modeReady());
      assert(await progress.isVisible());
      assert.equal(await progress.getAttribute('aria-valuenow'), null);
      assert.equal(await apply.isDisabled(), true);
      assert.match(await notice.textContent(), /Đang gửi yêu cầu/);
      assert.equal(await page.evaluate(() => window.modeWrites()), 1);
      if(kind==='sensor56')assert.equal(await page.evaluate(() => window.requestedMode()), 10);
    }

    for (const kind of ['legacy', 'sensor', 'sensor56']) {
      await setup(kind);
      await page.evaluate(() => window.releaseMode());
      await page.waitForFunction(() => document.getElementById('library-notice').textContent.includes('Hãy chờ'));
      assert(await progress.isVisible());
      await page.clock.fastForward(12050);
      await progress.waitFor({ state: 'hidden' });
      assert.equal(await notice.getAttribute('data-state'), 'sent');
      assert.match(await notice.textContent(), /Hãy kiểm tra/);
      assert.doesNotMatch(await notice.textContent(), /xong/);
      console.log('PASS', kind, 'shows bounded wait; never claims physical completion');
    }

    for (const error of [false, true]) {
      await setup('flash');
      await page.evaluate(() => window.releaseMode());
      await page.waitForFunction(() => document.getElementById('library-notice').textContent.includes('Thiết bị đã nhận lệnh'));
      assert(await progress.isVisible());
      await page.evaluate(error => window.endDraw(error), error);
      await progress.waitFor({ state: 'hidden' });
      assert.equal(await notice.getAttribute('data-state'), error ? 'error' : 'done');
      assert.match(await notice.textContent(), error ? /quá hạn/ : /Đã chuyển xong/);
      console.log('PASS flash', error ? 'firmware error' : 'actual ready confirmation');
    }

    await setup('legacy');
    await page.evaluate(() => window.cutLink());
    await progress.waitFor({ state: 'hidden' });
    assert.match(await notice.textContent(), /mất kết nối/);
    await page.evaluate(() => window.releaseMode());
    assert.equal(await notice.getAttribute('data-state'), 'error');
    assert.deepEqual(errors, []);
    console.log('PASS disconnect, without a stale success state');
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
