import { test, expect } from '@playwright/test';

const SITE = 'https://volunteer-cadillac-december-strategy.trycloudflare.com/';

test.describe('Chromium｜語音模式連續切換 10 次', () => {
  test('連續切換 Click/Hold 10 次並驗證', async ({ page, browserName }) => {
    // 只跑 Chromium
    test.skip(browserName !== 'chromium', '只驗證 Chromium');

    await page.goto(SITE, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /TAKE DRINK/i })).toBeVisible({ timeout: 30000 });

    // 進英文介面（或可在中文，兩者皆可；這裡固定走 EN）
    await page.getByRole('button', { name: /EN\s+English/i }).click();
    await expect(page.getByRole('heading', { name: /Welcome to Beverage Assistant/i })).toBeVisible({ timeout: 30000 });

    // 候選定位器（避免誤點麥克風按鈕「點擊語音輸入」等）
    const holdCandidates = [
      page.getByRole('button', { name: '按住', exact: true }),
      page.getByRole('button', { name: /^Hold$/i }),
      page.locator('button', { hasText: '按住' }),
      page.locator('button', { hasText: 'Hold' }),
    ];
    const clickCandidates = [
      page.getByRole('button', { name: '點擊', exact: true }),
      page.getByRole('button', { name: /^Click$/i }),
      page.locator('button', { hasText: '點擊' }).filter({ hasNotText: '語音輸入' }),
      page.locator('button', { hasText: 'Click' }),
    ];

    async function firstVisible(cands: ReturnType<typeof page.locator>[]) {
      for (const cand of cands) {
        const loc = cand.first();
        if (await loc.isVisible().catch(() => false)) return loc;
      }
      return undefined;
    }

    // 取得初始可操作的模式切換按鈕
    let holdBtn = await firstVisible(holdCandidates);
    let clickBtn = await firstVisible(clickCandidates);
    if (!holdBtn && !clickBtn) {
      const buf = await page.screenshot({ fullPage: true });
      await test.info().attach('no-voice-toggle-chromium.png', { body: buf, contentType: 'image/png' });
      throw new Error('未找到語音模式切換按鈕（Hold/按住 或 Click/點擊）');
    }

    // 定義一次「切換」：從當前狀態點擊顯示中的模式按鈕，使其切到另一種狀態
    async function toggleOnce(iter: number) {
      // 重新抓取（避免前次切換造成節點變動）
      holdBtn = await firstVisible(holdCandidates);
      clickBtn = await firstVisible(clickCandidates);

      if (holdBtn) {
        await holdBtn.click();
        // 切到 Click 後，Click 應可見
        clickBtn = await firstVisible(clickCandidates);
        await expect(clickBtn!).toBeVisible({ timeout: 10000 });
      } else if (clickBtn) {
        await clickBtn.click();
        // 切到 Hold 後，Hold 應可見
        holdBtn = await firstVisible(holdCandidates);
        await expect(holdBtn!).toBeVisible({ timeout: 10000 });
      } else {
        const buf = await page.screenshot({ fullPage: true });
        await test.info().attach(`toggle-missing-${iter}.png`, { body: buf, contentType: 'image/png' });
        throw new Error(`第 ${iter} 次切換時未偵測到任何語音模式按鈕`);
      }
    }

    // 連續切換 10 次
    for (let i = 1; i <= 10; i++) {
      await toggleOnce(i);
    }

    // 基本可用性檢查
    await expect(page.getByRole('textbox')).toBeVisible();
    await expect(page.getByRole('button', { name: /發送|Send/i })).toBeVisible();
  });
});
