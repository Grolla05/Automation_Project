import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Setores Wizard Navigation and Upload', () => {
  test('should complete the sector wizard and upload files', async ({ page }) => {
    // 1. Go to the app
    await page.goto('/');

    // 2. Select Sector: P5
    const sectorTrigger = page.locator('#sector-select');
    await sectorTrigger.click();
    await page.getByRole('option', { name: 'P5' }).click();
    await expect(sectorTrigger).toContainText('P5');

    // 3. Select Test Type: ASE
    const typeTrigger = page.locator('#test-type-select');
    await typeTrigger.click();
    await page.getByRole('option', { name: 'ASE' }).click();
    await expect(typeTrigger).toContainText('ASE');

    // 4. Select Test: AGULHA HIPODÉRMICA
    // Ensure the animation is done and the element is clickable
    const testItem = page.locator('[id="test-AGULHA HIPODÉRMICA"]');
    await expect(testItem).toBeVisible();
    await testItem.click();
    
    // Check if it's checked (Radix Checkbox.Root has aria-checked="true" or "false")
    await expect(testItem).toHaveAttribute('aria-checked', 'true');
    
    // 5. Click Next Step
    // Use getByRole for the button
    const nextButton = page.getByRole('button', { name: /Próximo Passo|Next Step/ });
    await expect(nextButton).toBeEnabled();
    await nextButton.click();

    // 6. Verify we are on the upload page
    await expect(page).toHaveURL(/\/upload/);
    await expect(page.locator('h1')).toContainText('Upload de Arquivos');

    // 7. Upload mock files
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('text=ou clique para navegar');
    const fileChooser = await fileChooserPromise;
    
    // d:/GitHub/Automation_Project/frontend/tests/fixtures
    const fixturesDir = path.resolve(__dirname, '../tests/fixtures');
    
    await fileChooser.setFiles([
      path.join(fixturesDir, 'mock_capa.pdf'),
      path.join(fixturesDir, 'mock_analoga.png'),
      path.join(fixturesDir, 'mock_registro.xlsx'),
    ]);

    // 8. Verify files were added
    // O texto incorpora o count: "3 arquivos adicionados"
    await expect(page.locator('text=3 arquivos adicionados')).toBeVisible();

    // 9. Verify Process button is enabled
    const processButton = page.getByRole('button', { name: /Processar/ });
    await expect(processButton).toBeEnabled();
  });
});
