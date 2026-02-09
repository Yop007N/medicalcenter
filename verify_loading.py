from playwright.sync_api import sync_playwright
import time

def run():
    print("Starting Playwright...")
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            print("Navigating to http://localhost:4200")
            page.goto("http://localhost:4200")

            # Wait for dashboard to load
            print("Waiting for dashboard content...")
            page.wait_for_selector("text=Dashboard Placeholder", timeout=10000)

            # Check for mat-progress-bar
            print("Checking for mat-progress-bar...")
            loading_bar = page.query_selector("mat-progress-bar")
            if loading_bar:
                print("SUCCESS: Loading bar found!")
            else:
                print("FAILURE: Loading bar NOT found!")

            # Take screenshot
            print("Taking screenshot...")
            page.screenshot(path="verification_loading.png")
            print("Screenshot saved to verification_loading.png")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification_error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    run()
