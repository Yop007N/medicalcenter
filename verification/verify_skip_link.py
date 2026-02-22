from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        page.goto("http://localhost:4200")

        # Focus on the skip link
        page.keyboard.press("Tab")

        # Wait for transition (it's 0.3s)
        page.wait_for_timeout(500)

        skip_link = page.get_by_role("link", name="Skip to main content")

        # Check if it is focused
        is_focused = page.evaluate("document.activeElement === document.querySelector('.skip-link')")
        print(f"Is focused: {is_focused}")

        # Get bounding box
        box = skip_link.bounding_box()
        print(f"Focused position: {box['y']}")

        # Take screenshot
        page.screenshot(path="verification/skip_link_focused.png")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
