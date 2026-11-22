const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

(async () => {
  const browser = await chromium.launch({ executablePath: process.argv[2], headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  async function setup(branch, fail = false) {
    await page.goto(pathToFileURL(path.join(__dirname, 'index.html')).href);
    await page.evaluate(async ({ branch, fail }) => {
      const server = { connected: true };
      let unblock, response, writes = 0, bufferWrites = 0;
      let mode = 1;
      const write = async data => {
        const a = Array.from(data);
        writes++;
        if (a[0] === 3 || a[0] === 4) {
          bufferWrites++;
          if (bufferWrites === 24) await new Promise(r => { unblock = r; });
        }
        if (a[0] === 2) mode = 0;
        if (branch === 'uc' && [2, 6, 7, 9].includes(a[0])) {
          const ack = a[0] === 2 ? 0xff : a[0] === 6 ? 0 : a[0] === 7 ? a[1] + 1 : 0xfe;
          response = new DataView(Uint8Array.of(0, 0x75, ack).buffer);
        }
        const [kind, group, op, seq] = a;
        if (group === 0x42 && (kind === 0xe8 || kind === 0xe9)) {
          const b = new Uint8Array(kind === 0xe9 && op === 0 ? 9 : kind === 0xe8 && op === 0 ? 20 : op === 33 ? 9 : op === 3 ? 7 : 6);
          b.set([kind, group, op, seq, 0]);
          if (kind === 0xe9 && op === 0) b.set([109, 4, 0x26, 2], 5);
          if (kind === 0xe9 && op === 3) b[6] = mode;
          if (kind === 0xe8 && op === 0) {
            b[5] = b[6] = b[18] = 1; b[19] = branch === 'picture' ? 12 : 180;
            new DataView(b.buffer).setUint32(12, Font420Bundle.crc32, true);
          }
          if (op === 33) {
            const oldOffset = new DataView(Uint8Array.from(a.slice(4, 8)).buffer).getUint32(0, true);
            new DataView(b.buffer).setUint32(5, oldOffset + a.length - 8, true);
            if (++bufferWrites === 24) await new Promise(r => { unblock = r; });
          }
          response = new DataView(b.buffer);
        }
      };
      const characteristic = { writeValueWithResponse: write, readValue: async () => response };
      gattServer = server;
      epdService = { getCharacteristic: async () => characteristic };
      bleDevice = { name: 'C26_TEST' };
      sleep = async ms => {
        if (fail && ms === 15000) await new Promise(r => { unblock = r; });
      };
      if (branch === 'flash' || branch === 'picture') {
        // Probe, state, main bundle metadata, and extra bundle metadata.
        const read = characteristic.readValue;
        characteristic.readValue = async () => {
          if (response?.getUint8(2) === 35) {
            const b = new Uint8Array(14);
            b.set(new Uint8Array(response.buffer));
            new DataView(b.buffer).setUint32(6, Font420Features.bold109.auxLength, true);
            new DataView(b.buffer).setUint32(10, Font420Features.bold109.auxCrc, true);
            return new DataView(b.buffer);
          }
          return read();
        };
        if (!await Flash420.attach(epdService, server)) throw Error('Flash fixture not attached');
      }
      etagFnEnable(true);
      window.EpdLibrary.refresh();
      document.getElementById('library-tab-images').click();
      document.getElementById('screensize').value = branch === 'uc' ? '640*384' : '400*300';
      if (branch === 'picture') document.getElementById('imageTarget').value = 'scene4';
      const canvas = document.getElementById('canvas');
      canvas.width = branch === 'uc' ? 640 : 400; canvas.height = branch === 'uc' ? 384 : 300;
      window.mockReady = () => !!unblock;
      window.unblockMock = () => unblock();
      window.stopMock = () => { server.connected = false; disconnect(); };
      window.countWrites = () => writes;
    }, { branch, fail });
  }
  for (const branch of ['legacy', 'flash', 'uc', 'picture']) {
    await setup(branch);
    await page.locator('#uploadImageButton').click();
    await page.waitForFunction(() => window.mockReady() ||
      document.getElementById('imageTransferPanel').dataset.state === 'error', null, { timeout: 6000 });
    assert(await page.evaluate(() => window.mockReady()), await page.locator('#imageUploadStatus').textContent());
    assert(await page.locator('#imageTransferPanel').isVisible());
    await page.waitForFunction(() => {
      const p = document.getElementById('imageUploadProgress');
      return p.value > 0 && p.value < 100;
    });
    assert(await page.locator('#uploadImageButton').isDisabled());
    await page.evaluate(() => window.unblockMock());
    await page.waitForSelector('#imageTransferPanel[data-state="done"]');
    assert.equal(await page.locator('#imageUploadProgress').evaluate(el => el.value), 100);
    assert.match(await page.locator('#imageTransferLog').textContent(), /Đang chờ màn hình làm mới|Đang chờ mở mặt đồng hồ/);
    console.log('PASS', branch, 'start, real fractional progress, finishing, success');
  }
  await setup('legacy', true);
  await page.locator('#uploadImageButton').click();
  await page.waitForFunction(() => window.mockReady());
  const writes = await page.evaluate(() => window.countWrites());
  await page.evaluate(() => window.stopMock());
  await page.waitForSelector('#imageTransferPanel[data-state="error"]');
  assert.match(await page.locator('#imageUploadStatus').textContent(), /Mất kết nối/);
  assert(await page.locator('#library-panel-images').isVisible());
  await page.evaluate(() => window.unblockMock());
  await page.waitForFunction(() => imageTransfer === null);
  assert.equal(await page.evaluate(() => window.countWrites()), writes);
  assert.deepEqual(errors, []);
  console.log('PASS disconnect: visible error, no success, no further writes');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
