// tests/image-upload.spec.ts
import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";
const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:5173";
async function writeTmp(testInfo, filename, data) {
    const p = testInfo.outputPath(filename);
    await fs.promises.mkdir(path.dirname(p), { recursive: true });
    await fs.promises.writeFile(p, data);
    return p;
}
const PNG_1x1_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";
const JPG_1x1_BASE64 = "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxAQEA8QEA8QDw8QDw8PDw8PDw8QFREWFhURFRUYHSggGBolHRUVITEhJSorLi4uFx8zODMtNygtLisBCgoKDg0OGhAQGi0lHyYtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIAAEAAQMBIgACEQEDEQH/xAAbAAACAwEBAQAAAAAAAAAAAAADBAECBQYAB//EADgQAAIBAwMCBAQEBgMAAAAAAAECAwAEEQUSIRMxQVEGImFxgZEyQqHB0fAHFSNSkqLC8P/EABkBAQADAQEAAAAAAAAAAAAAAAABAgMEBf/EACMRAQEAAgICAgMBAAAAAAAAAAABAhEDIRIxBEEiUWEycbH/2gAMAwEAAhEDEQA/APn6xgYzZ3lQq3tK9r0pG1xA4bV9n8a7V/Up3mVh0j6xLZ4kqa8qU6GkqL6uIPG6m+0a3k8XwG9sNq7q5a4d1p8q8F9S4q1q8O9B0Z9bF1Q3R2S3uS7Jw2N8qzq3z2R3O5H9D0YfBqkW2nq9f7u3ba9n8kqybLQA6kH5n0//2Q==";
test.describe("画像アップロード・表示フロー", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(BASE_URL);
        await expect(page.locator('[role="treeitem"][aria-level="1"]').first()).toBeVisible();
    });
    const parentRow = (page) => page.locator('[role="treeitem"][aria-level="1"]').first();
    const openImagePanel = async (page) => {
        const row = parentRow(page);
        await row.locator('[data-testid^="btn-image-"]').first().click();
        await expect(row.getByText(/画像は未設定です。|画像を追加|画像を変更/)).toBeVisible();
        return row;
    };
    test("リスト→サムネクリック→ドロワー画像タブが開く（フォーカス戻り含む）", async ({ page, }, testInfo) => {
        const row = await openImagePanel(page);
        // 有効画像をアップロード
        const imgPath = await writeTmp(testInfo, "ok.png", Buffer.from(PNG_1x1_BASE64, "base64"));
        await row.getByRole("button", { name: /画像を追加|画像を変更/ }).click();
        await row.locator('input[type="file"]').setInputFiles(imgPath);
        // サムネが表示されるまで余裕を持って待機
        await expect(row.getByRole("img", { name: "サムネイル" })).toBeVisible({
            timeout: 10000,
        });
        // サムネ（CompactThumb）でドロワーを開く（ラベル更新を属性で確認）
        const thumbBtn = row.locator('[data-testid^="task-thumb-"]').first();
        await expect(thumbBtn).toBeVisible();
        await expect(thumbBtn).toHaveAttribute("aria-label", "画像を表示");
        await thumbBtn.click();
        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible();
        await expect(page.locator('#drawer-image-section img[data-testid="drawer-image"]')).toBeVisible({ timeout: 15000 });
        // 閉じる → フォーカス復帰
        await dialog.getByRole("button", { name: "閉じる" }).click();
        await expect(thumbBtn).toBeFocused();
    });
    test("親：添付→表示→置換→削除→再読込でも永続状態一致", async ({ page, }, testInfo) => {
        const row = await openImagePanel(page);
        // 添付
        const img1 = await writeTmp(testInfo, "img1.jpg", Buffer.from(JPG_1x1_BASE64, "base64"));
        await row.getByRole("button", { name: /画像を追加|画像を変更/ }).click();
        await row.locator('input[type="file"]').setInputFiles(img1);
        await expect(row.getByRole("img", { name: "サムネイル" })).toBeVisible({
            timeout: 10000,
        });
        await expect(row.getByRole("button", { name: "画像を表示" })).toBeVisible();
        // 置換
        const img2 = await writeTmp(testInfo, "img2.png", Buffer.from(PNG_1x1_BASE64, "base64"));
        await row.getByRole("button", { name: /画像を変更/ }).click();
        await row.locator('input[type="file"]').setInputFiles(img2);
        await expect(row.getByRole("img", { name: "サムネイル" })).toBeVisible({
            timeout: 10000,
        });
        // 削除（画像パネル側の削除を明示）
        page.once("dialog", (d) => d.accept());
        await row.getByTestId("btn-delete").click();
        await expect(row.getByText("画像は未設定です。")).toBeVisible();
        const thumbAfterDelete = row
            .locator('[data-testid^="task-thumb-"]')
            .first();
        await expect(thumbAfterDelete).toHaveAttribute("aria-label", "画像は未設定");
        // リロードしても未設定のまま
        await page.reload();
        const row2 = parentRow(page);
        await expect(row2.getByRole("button", { name: "画像は未設定" }).first()).toBeVisible();
        await expect(row2.getByRole("button", { name: "画像を表示" })).toHaveCount(0);
    });
    test("子：画像UIなし（またはdisabled）", async ({ page }) => {
        const row = parentRow(page);
        const toggle = row
            .getByRole("button", { name: /子タスクを表示|子タスクを隠す/ })
            .first();
        if (await toggle.isVisible()) {
            const expanded = await toggle.getAttribute("aria-expanded");
            if (expanded !== "true")
                await toggle.click();
        }
        const childRow = page.locator('[role="treeitem"][aria-level="2"]').first();
        if ((await childRow.count()) === 0)
            test.skip(true, "子タスクが無いデータのためスキップ");
        await expect(childRow.getByRole("button", { name: "画像" })).toHaveCount(0);
        await expect(childRow.getByRole("button", { name: /画像を表示|画像は未設定/ })).toHaveCount(0);
    });
    test("非画像 / 5MB超：バリデーション表示", async ({ page }, testInfo) => {
        const row = await openImagePanel(page);
        // 非画像
        const txt = await writeTmp(testInfo, "ng.txt", Buffer.from("hello", "utf8"));
        await row.getByRole("button", { name: /画像を追加|画像を変更/ }).click();
        await row.locator('input[type="file"]').setInputFiles(txt);
        await expect(row.getByTestId("img-error")).toContainText("許可形式");
        // 5MB超（形式は画像にしてサイズ判定を通す）
        const bigBuffer = Buffer.alloc(6 * 1024 * 1024);
        await row.getByRole("button", { name: /画像を追加|画像を変更/ }).click();
        await row.locator('input[type="file"]').setInputFiles({
            name: "big.png",
            mimeType: "image/png",
            buffer: bigBuffer,
        });
        await expect(row.getByTestId("img-error")).toContainText("MB以下");
    });
});
