import { test, expect } from '@playwright/test';

const SITE = 'https://toyama.helenfit.com';
const USERNAME = 'nikanorge@gmail.com';
const PASSWORD = '(5%vy2XhqT';

test.describe('Toyama Multiple Deletion Test', () => {
  test('Delete all shops with report date 2025-09-01', async ({ page }) => {
    // Increase test timeout to 5 minutes
    test.setTimeout(300000);
    
    // Navigate to login page
    await page.goto(SITE);

    // Fill login form
    await page.getByLabel('帳號').fill(USERNAME);
    await page.getByRole('textbox', { name: '密碼' }).fill(PASSWORD);

    // Click login button
    await page.getByRole('button', { name: '登入' }).click();

    // Wait for navigation to main page and table to load
    await expect(page.getByRole('heading', { name: '我上傳的特店列表' })).toBeVisible({ timeout: 30000 });

    let deletionCount = 0;
    const maxDeletions = 50; // Safety limit to prevent infinite loop

    // Keep deleting until no more 2025-09-01 records are found
    while (deletionCount < maxDeletions) {
      console.log(`\n--- Deletion attempt ${deletionCount + 1} ---`);
      
      // Find rows with report date 2025-09-01
      const rows = page.locator('table tbody tr').filter({ hasText: '2025-09-01' });
      const rowCount = await rows.count();
      
      if (rowCount === 0) {
        console.log('Success! No more rows with date 2025-09-01 found.');
        break;
      }
      
      console.log(`Found ${rowCount} rows with date 2025-09-01`);
      
      // Get the specific text of the first row to track it
      const firstRowText = await rows.first().textContent();
      const timeStamp = firstRowText?.match(/2025-09-01T\d{2}:\d{2}:\d{2}/)?.[0] || 'unknown';
      console.log(`Target row timestamp: ${timeStamp}`);

      // Click delete button in the first row
      console.log('Clicking delete button...');
      await rows.first().getByRole('button', { name: '󰆴' }).click();

      // Wait for and handle confirmation dialog
      await page.waitForTimeout(1000);
      
      const confirmButton = page.getByRole('button', { name: /確認|確定|OK|是|刪除/ });
      
      try {
        await confirmButton.waitFor({ timeout: 3000 });
        console.log('Confirmation dialog found, clicking confirm...');
        await confirmButton.click();
        console.log('Confirmation dialog confirmed');
      } catch (e) {
        console.log('No confirmation dialog found, proceeding...');
      }

      // Wait for deletion to process
      console.log('Waiting for deletion to process...');
      await page.waitForTimeout(3000);

      // Check if the specific row is gone
      if (firstRowText) {
        const specificRowExists = await page.locator('table tbody tr').filter({ hasText: firstRowText }).count();
        if (specificRowExists === 0) {
          console.log(`✅ Successfully deleted row with timestamp: ${timeStamp}`);
          deletionCount++;
        } else {
          console.log(`❌ Failed to delete row with timestamp: ${timeStamp}`);
          break; // Exit if deletion failed
        }
      }

      // Check new count after deletion
      const newRowCount = await page.locator('table tbody tr').filter({ hasText: '2025-09-01' }).count();
      console.log(`Remaining rows with date 2025-09-01: ${newRowCount}`);
      
      // Small delay before next iteration
      await page.waitForTimeout(1000);
    }

    if (deletionCount >= maxDeletions) {
      console.log(`⚠️ Reached maximum deletion limit (${maxDeletions}). Some records may remain.`);
    }

    // Final verification
    console.log('\n--- Final verification ---');
    await page.reload();
    await expect(page.getByRole('heading', { name: '我上傳的特店列表' })).toBeVisible({ timeout: 10000 });
    
    const finalRowCount = await page.locator('table tbody tr').filter({ hasText: '2025-09-01' }).count();
    console.log(`\n🎯 FINAL RESULT:`);
    console.log(`   Total deletions performed: ${deletionCount}`);
    console.log(`   Final count of 2025-09-01 records: ${finalRowCount}`);
    
    if (finalRowCount === 0) {
      console.log(`   ✅ SUCCESS: All 2025-09-01 records have been deleted!`);
    } else {
      console.log(`   ⚠️  ${finalRowCount} records with 2025-09-01 still remain.`);
    }
  });
});
