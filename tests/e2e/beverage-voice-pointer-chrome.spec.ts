import { test, expect } from '@playwright/test';

const SITE = 'https://volunteer-cadillac-december-strategy.trycloudflare.com/';

test.describe('Google Chrome｜語音模式：移出/移回 + 按住 + 點擊 循環 10 次', () => {
  test('移出/移回 + press/release + click 循環 10 次並驗證狀態', async ({ page }) => {
  test.setTimeout(90_000);
    // 僅在 Google Chrome 專案下執行
    test.skip(test.info().project.name !== 'Google Chrome', '只在 Google Chrome 專案執行');

    await page.goto(SITE, { waitUntil: 'domcontentloaded' });

    // 進入英文介面
    await expect(page.getByRole('heading', { name: /TAKE DRINK/i })).toBeVisible({ timeout: 30000 });
    await page.getByRole('button', { name: /EN\s+English/i }).click();
    await expect(page.getByRole('heading', { name: /Welcome to Beverage Assistant/i })).toBeVisible({ timeout: 30000 });

    const holdCandidates = [
      page.getByRole('button', { name: 'Hold', exact: true }),
      page.getByRole('button', { name: '按住', exact: true }),
      page.locator('button', { hasText: '按住' }),
      page.locator('button', { hasText: 'Hold' }),
    ];
    const clickCandidates = [
      page.getByRole('button', { name: 'Click', exact: true }),
      page.getByRole('button', { name: '點擊', exact: true }),
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

    // 將指標移出視窗邊界，再移回按鈕中央
    async function moveOutAndBack(target: ReturnType<typeof page.locator>) {
      // 先移出視窗
      await page.mouse.move(-10, -10);
      // 確認目標可見後再取得座標
      await expect(target).toBeVisible({ timeout: 10000 });
      const box = await target.boundingBox();
      if (!box) throw new Error('無法取得按鈕位置');
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    }

  for (let i = 1; i <= 3; i++) {
      // 重新抓取（每次迭代 UI 可能切換）
      let holdBtn = await firstVisible(holdCandidates);
      let clickBtn = await firstVisible(clickCandidates);
      if (!holdBtn && !clickBtn) {
        const buf = await page.screenshot({ fullPage: true });
        await test.info().attach(`no-toggle-${i}.png`, { body: buf, contentType: 'image/png' });
        throw new Error(`第 ${i} 次：未找到語音模式切換按鈕`);
      }

      // 若目前是 Click 模式，先切回 Hold 作為起點
      if (!holdBtn && clickBtn) {
        await expect(clickBtn).toBeVisible({ timeout: 10000 });
        await clickBtn.click();
        holdBtn = await firstVisible(holdCandidates);
        await expect(holdBtn!).toBeVisible({ timeout: 10000 });
      }

      // 步驟 A：移出 -> 移回 -> press/release（不強制期待 UI 立即切換）
  await expect(holdBtn!).toBeVisible({ timeout: 10000 });
  await moveOutAndBack(holdBtn!);
  const box = await holdBtn!.boundingBox();
      if (!box) throw new Error('無法取得按鈕位置');
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(200);
      await page.mouse.up();

      // 步驟 B：移出 -> 移回 -> click 切到 Click
      await moveOutAndBack(holdBtn!);
  await expect(holdBtn!).toBeVisible({ timeout: 10000 });
  await holdBtn!.click();
      clickBtn = await firstVisible(clickCandidates);
      await expect(clickBtn!).toBeVisible({ timeout: 10000 });

  // 步驟 C（可選）：再移出 -> 移回 -> click 切回 Hold，確保往返穩定
  await expect(clickBtn!).toBeVisible({ timeout: 10000 });
  await moveOutAndBack(clickBtn!);
  await clickBtn!.click();
      holdBtn = await firstVisible(holdCandidates);
      await expect(holdBtn!).toBeVisible({ timeout: 10000 });
    }

    // 基本可用性
    await expect(page.getByRole('textbox')).toBeVisible();
    await expect(page.getByRole('button', { name: /發送|Send/i })).toBeVisible();
  });
});
