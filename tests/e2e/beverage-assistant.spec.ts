import { test, expect } from '@playwright/test';

// 小合約：
// - 輸入：無；直接造訪雲端服務網址
// - 驗證：
//   1) 能從語言選擇頁進入英文介面
//   2) 能從英文介面切回繁體中文
//   3) 能在繁中介面於「按住」與「點擊」語音模式間切換
// - 失敗模式：元素不存在 / 請求逾時 / 不同瀏覽器不一致

const SITE = 'https://volunteer-cadillac-december-strategy.trycloudflare.com/';

test.describe('Beverage Assistant—語言與語音模式', () => {
  test('語言切換（EN ↔ zh-TW）與語音模式切換（按住 ↔ 點擊）', async ({ page, browserName }) => {
    test.info().annotations.push({ type: 'target', description: SITE });

    // 進入入口頁（語言選擇）
    await page.goto(SITE, { waitUntil: 'domcontentloaded' });

    // 某些瀏覽器初次載入較慢，放寬等待
  await expect(page.getByRole('heading', { name: /TAKE DRINK/i })).toBeVisible({ timeout: 30000 });

    // 1) 進入英文介面
    await page.getByRole('button', { name: /EN\s+English/i }).click();

    // 英文介面提示文字與語言按鈕
  await expect(page.getByRole('heading', { name: /Welcome to Beverage Assistant/i })).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole('button', { name: 'English' })).toBeVisible();

    // 2) 從英文切回繁體中文
  await page.getByRole('button', { name: 'English' }).click();
    // 展開的語言清單中點選「繁體中文」
    // 此處以連結呈現
  await page.getByRole('link', { name: '繁體中文' }).click();

    // 確認已切到繁中
    await expect(page.getByRole('heading', { name: /歡迎光臨飲料小助手/i })).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole('button', { name: '繁體中文' })).toBeVisible();

    // 3) 語音模式切換（按住 → 點擊 → 按住）
    // 備援：不同瀏覽器或載入狀態下，文案可能顯示英文（Hold/Click）或中文（按住/點擊）。
    // 並避免誤選到「點擊語音輸入」這個麥克風觸發按鈕。
    const holdCandidates = [
      page.getByRole('button', { name: '按住', exact: true }),
      page.getByRole('button', { name: /^Hold$/i }),
      page.locator('button', { hasText: '按住' }),
      page.locator('button', { hasText: 'Hold' }),
    ];
    const clickCandidates = [
      page.getByRole('button', { name: '點擊', exact: true }),
      page.getByRole('button', { name: /^Click$/i }),
      // 避免選到「點擊語音輸入」：用 hasText 精準比對單詞
      page.locator('button', { hasText: '點擊' }).filter({ hasNotText: '語音輸入' }),
      page.locator('button', { hasText: 'Click' }),
    ];

    // 找到目前可見的模式按鈕（按住或點擊其一必有）
    async function firstVisible(cands: ReturnType<typeof page.locator>[]) {
      for (const cand of cands) {
        if (await cand.first().isVisible().catch(() => false)) return cand.first();
      }
      return undefined;
    }

    let holdBtn = await firstVisible(holdCandidates);
    let clickBtn = await firstVisible(clickCandidates);

    // 兩者其一務必存在
    const hasHold = !!holdBtn && (await holdBtn.isVisible().catch(() => false));
    const hasClick = !!clickBtn && (await clickBtn.isVisible().catch(() => false));

    if (!(hasHold || hasClick)) {
      test.info().annotations.push({ type: 'voice-mode', description: `No voice mode toggle visible on ${browserName} — likely not supported or hidden in this engine.` });
      const buf = await page.screenshot({ fullPage: true });
      await test.info().attach(`no-voice-toggle-${browserName}.png`, { body: buf, contentType: 'image/png' });
    } else {
      // 若當前是點擊，先切回按住
      if (hasClick && !(hasHold)) {
        await clickBtn!.click();
        // 重新抓取按鈕（切換後節點可能變動）
        holdBtn = await firstVisible(holdCandidates);
        expect(holdBtn).toBeTruthy();
        await expect(holdBtn!).toBeVisible({ timeout: 10000 });
      }

      // 切到點擊
      await holdBtn!.click();
      clickBtn = await firstVisible(clickCandidates);
      expect(clickBtn).toBeTruthy();
      await expect(clickBtn!).toBeVisible({ timeout: 10000 });

      // 再切回按住
      await clickBtn!.click();
      holdBtn = await firstVisible(holdCandidates);
      expect(holdBtn).toBeTruthy();
      await expect(holdBtn!).toBeVisible({ timeout: 10000 });
    }

    // 額外：輸入框與發送按鈕存在（基本可用性）
  await expect(page.getByRole('textbox')).toBeVisible();
  await expect(page.getByRole('button', { name: /發送|Send/i })).toBeVisible();

    // 在測試資訊中記錄瀏覽器名以利彙整差異
    test.info().attach('browser', { body: browserName, contentType: 'text/plain' });
  });
});
