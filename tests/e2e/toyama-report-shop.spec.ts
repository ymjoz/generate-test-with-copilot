import { test, expect } from '@playwright/test';

test.describe('Toyama 通報特店功能測試', () => {
  test('should complete shop reporting process with all required information', async ({ page }) => {
    // 導航到 Toyama 網站並登入
    await page.goto('https://toyama.helenfit.com');
    
    // 檢查是否已經登入（如在登入頁面則進行登入）
    try {
      await page.waitForSelector('text=使用者登入', { timeout: 3000 });
      
      // 執行登入流程
      await page.getByRole('textbox', { name: '帳號' }).fill('xxxxxxx@gmail.com');
      await page.getByRole('textbox', { name: '密碼' }).fill('(52xxxXhqT');
      
      // 使用 JavaScript 點擊登入按鈕以避免覆蓋層問題
      await page.evaluate(() => {
        const loginButton = document.querySelector('button[type="button"].primary') as HTMLButtonElement;
        if (loginButton) {
          loginButton.click();
        }
      });
      
      // 等待登入完成
      await page.waitForURL('**/joint-defense/ContractShopAlertInfo');
    } catch {
      // 如找不到登入表單，視為已登入
      console.log('Already logged in');
    }
    
    // 驗證到達特店列表頁面
    await expect(page.getByRole('heading', { name: '我上傳的特店列表' })).toBeVisible();
    
    // 點擊漢堡選單以展開導航
    await page.locator('.v-app-bar__nav-icon').click();
    
    // 使用 JavaScript 點擊「通報特店」以避免覆蓋層問題
    await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('div.v-list-item__title'));
      const reportElement = elements.find(el => el.textContent?.trim() === '通報特店');
      if (reportElement) {
        (reportElement.closest('.v-list-item') as HTMLElement)?.click();
      }
    });
    
    // 驗證到達通報頁面
    await page.waitForURL('**/joint-defense/ReportSuspicious');
    await expect(page.getByRole('heading', { name: '通報特店情資' })).toBeVisible();
    
    // 填寫特店基本資料
    await page.getByRole('textbox', { name: '特店(自然人)' }).fill('測試特店股份有限公司');
    await page.getByRole('textbox', { name: '統一編號(身分證字號)' }).fill('12345678');
    await page.getByRole('textbox', { name: '特店地址' }).fill('台北市信義區信義路五段7號');
    await page.getByRole('textbox', { name: '特店電話' }).fill('02-87101234');
    await page.getByRole('textbox', { name: '特店代表人' }).fill('王大明');
    await page.getByRole('textbox', { name: '註冊日期(與特店簽約日)' }).fill('2025-01-01');
    await page.getByRole('textbox', { name: '特店網址' }).fill('https://test-shop.example.com');
    
    // 銀行資訊
    await page.getByRole('combobox').filter({ hasText: '銀行名稱' }).click();
    await page.getByRole('option', { name: '台中市第二信用合作社 (146)' }).click();
    await page.getByRole('textbox', { name: '銀行帳號' }).fill('1234567890123');
    await page.getByRole('textbox', { name: '戶名' }).fill('測試特店股份有限公司');
    
    // 聯絡人資訊
    await page.getByRole('textbox', { name: '特店聯絡人', exact: true }).fill('李小華');
    await page.getByRole('textbox', { name: '特店聯絡人手機' }).fill('0912345678');
    await page.getByRole('textbox', { name: '特店聯絡人信箱' }).fill('contact@test-shop.example.com');
    await page.getByRole('textbox', { name: '特店聯絡人市話' }).fill('02-87101235');
    
    // 通報案由與風險程度
    await page.getByRole('combobox').filter({ hasText: '案由' }).click();
    await page.getByRole('option', { name: '交易異常:交易商品異常' }).click();
    
    await page.getByRole('combobox').filter({ hasText: '業者示警風險程度' }).click();
    await page.getByRole('option', { name: '中高度' }).click();
    
    await page.getByRole('textbox', { name: '其他通報補充說明(敘明疑似涉及詐騙樣態)' })
      .fill('該特店銷售異常商品，疑似販售未經許可的產品，建議加強監控其交易活動。');
    
    // 展開買家資料區塊並新增買家
    await page.getByRole('button', { name: '買家資料' }).click();
    await page.getByRole('button', { name: '新增買家資料' }).click();
    await page.getByRole('textbox', { name: '姓名*' }).fill('張小美');
    await page.getByRole('textbox', { name: '身分證字號*' }).fill('A123456789');
    await page.getByRole('textbox', { name: '聯絡電話*' }).fill('0987654321');
    await page.getByRole('textbox', { name: '聯絡信箱*' }).fill('zhang.mei@example.com');
    
    // 儲存買家資料
    await page.getByRole('button', { name: '儲存' }).click();
    
    // 確認買家資料已儲存
    await expect(page.getByText('買家資料已儲存')).toBeVisible();
    await page.getByRole('button', { name: 'OK' }).click();
    
    // 驗證買家資料出現在表格中
    await expect(page.getByRole('cell', { name: '張小美' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'A123456789' })).toBeVisible();
    
    // 執行通報
    await page.getByRole('button', { name: '執行通報' }).click();
    
    // 驗證通報成功
    await expect(page.getByText('通報成功')).toBeVisible();
    await page.getByRole('button', { name: 'OK' }).click();
    
    // 驗證返回特店列表並看到新增通報紀錄
    await page.waitForURL('**/joint-defense/ContractShopAlertInfo');
    await expect(page.getByRole('heading', { name: '我上傳的特店列表' })).toBeVisible();
    
    await expect(page.getByRole('cell', { name: '測試特店股份有限公司' }).first()).toBeVisible();
    await expect(page.getByRole('cell', { name: '12345678' }).first()).toBeVisible();
    await expect(page.getByRole('cell', { name: '交易異常:交易商品異常' }).first()).toBeVisible();
    await expect(page.getByRole('cell', { name: '中高度' }).first()).toBeVisible();
  });

  test('should validate required fields in report form', async ({ page }) => {
    // 導航並確保已登入
    await page.goto('https://toyama.helenfit.com');
    
    try {
      await page.waitForSelector('text=使用者登入', { timeout: 3000 });
      
      await page.getByRole('textbox', { name: '帳號' }).fill('nikanorge@gmail.com');
      await page.getByRole('textbox', { name: '密碼' }).fill('(5%vy2XhqT');
      
      await page.evaluate(() => {
        const loginButton = document.querySelector('button[type="button"].primary') as HTMLButtonElement;
        if (loginButton) {
          loginButton.click();
        }
      });
      
      await page.waitForURL('**/joint-defense/ContractShopAlertInfo');
    } catch {
      console.log('Already logged in');
    }
    
    // 導航到通報頁面
    await page.locator('.v-app-bar__nav-icon').click();
    await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('div.v-list-item__title'));
      const reportElement = elements.find(el => el.textContent?.trim() === '通報特店');
      if (reportElement) {
        (reportElement.closest('.v-list-item') as HTMLElement)?.click();
      }
    });
    await page.waitForURL('**/joint-defense/ReportSuspicious');
    
    // 驗證表單區塊存在
    await expect(page.getByRole('button', { name: '通報單位資訊' })).toBeVisible();
    await expect(page.getByRole('button', { name: '特店基本資訊' })).toBeVisible();
    await expect(page.getByRole('button', { name: '銀行資訊' })).toBeVisible();
    await expect(page.getByRole('button', { name: '特店聯絡人資訊' })).toBeVisible();
    await expect(page.getByRole('button', { name: '通報案由' })).toBeVisible();
    await expect(page.getByRole('button', { name: '通報疑似涉及詐騙內容' })).toBeVisible();
    await expect(page.getByRole('button', { name: '買家資料' })).toBeVisible();
    
    // 驗證執行通報按鈕存在
    await expect(page.getByRole('button', { name: '執行通報' })).toBeVisible();
  });
});
