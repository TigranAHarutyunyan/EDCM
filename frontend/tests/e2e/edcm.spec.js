import { test, expect } from '@playwright/test';

test.describe('EDCM E2E Scenarios', () => {

  // Helper function to login before tests that require authentication
  async function login(page) {
    await page.goto('/login');
    // Assuming standard login inputs
    await page.fill('input[type="text"], input[name="username"]', 'admin'); 
    await page.fill('input[type="password"], input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  }

  test('1. User can successfully log in', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="text"], input[name="username"]', 'admin');
    await page.fill('input[type="password"], input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Assert we are redirected to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.getByText('Overview of your document activities').or(page.getByText('Обзор ваших действий с документами')).or(page.getByText('Ձեր փաստաթղթերի ակնարկ'))).toBeVisible();
  });

  test('2. Login fails with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="text"], input[name="username"]', 'wronguser');
    await page.fill('input[type="password"], input[name="password"]', 'wrongpass');
    await page.click('button[type="submit"]');
    
    // Look for generic error text styling
    await expect(page.locator('.text-red-500, .text-red-600, .error').first()).toBeVisible();
  });

  test('3. Dashboard loads document statistics', async ({ page }) => {
    await login(page);
    
    // Check if stats are visible
    await expect(page.locator('text=Total Documents').or(page.locator('text=Всего документов')).or(page.locator('text=Ընդհանուր փաստաթղթեր'))).toBeVisible();
  });

  test('4. User can open the New Document modal', async ({ page }) => {
    await login(page);
    
    // Click the create new button
    await page.getByRole('button', { name: /\+ Create New|\+ Создать|\+ Ստեղծել նոր/ }).click();
    
    // Verify the modal opens
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('5. User can search for a document by ID', async ({ page }) => {
    await login(page);
    
    // Fill the search input
    const searchInput = page.getByPlaceholder(/View Document by ID|Поиск по ID|Դիտել փաստաթուղթը/);
    await searchInput.fill('123');
    
    // Click the View button
    await page.getByRole('button', { name: /View|Посмотреть|Դիտել/ }).click();
  });

  test('6. User can toggle Dark Mode', async ({ page }) => {
    await login(page);
    
    // Click the theme toggle button (first button in nav)
    const themeToggle = page.locator('nav button').first(); 
    await themeToggle.click();
    
    // Check if dark mode class is applied to navbar
    const navbar = page.locator('nav');
    await expect(navbar).toHaveClass(/bg-slate-900|bg-slate-800/);
  });

  test('7. User can switch the application language', async ({ page }) => {
    await login(page);
    
    // Open language dropdown
    const languageSelector = page.getByText(/EN|RU|AM/).first();
    await languageSelector.click();
    
    // Select Russian
    await page.getByText('RU').click();
    
    // Check if translation applied
    await expect(page.getByText('Панель управления').first()).toBeVisible();
  });

  test('8. User can filter documents by "All"', async ({ page }) => {
    await login(page);
    
    // Click the filter button (All)
    await page.getByRole('button', { name: /All|Все|Բոլորը/ }).click();
    
    // Verify table header is visible
    await expect(page.getByRole('columnheader', { name: /Title|Заголовок|Վերնագիր/ })).toBeVisible();
  });

  test('9. User can navigate to the Profile page', async ({ page }) => {
    await login(page);
    
    // Click the Profile link in the Navbar
    await page.getByRole('link', { name: /Profile|Профиль|Պրոֆիլ/ }).click();
    
    await expect(page).toHaveURL(/.*profile/);
  });

  test('10. User can log out successfully', async ({ page }) => {
    await login(page);
    
    // Click the logout button
    const logoutButton = page.locator('button[title="Logout"], button[title="Выйти"], button[title="Դուրս գալ"]').first();
    await logoutButton.click();
    
    await expect(page).toHaveURL(/.*login/);
  });

});
