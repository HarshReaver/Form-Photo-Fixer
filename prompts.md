## Prompt 1 - build

Build 'Form Photo Fixer' in the folder C:\Users\admin\Documents\Harsh Vanguard\Vscode\28. BSERC AI Projects\02-Form-Photo-Fixer. It's a web app that gets a photo and a signature ready for Indian exam and job application forms.

What to build:
1. Upload a photo and a signature.
2. At least 3 presets for real forms (for example SSC, IBPS and GATE or UPSC). Search the web for each form's current official notice and use its exact photo and signature rules: pixel or cm size and KB min/max. Put the notice links in README.md under 'Form rules'.
3. Crop with a box locked to the preset's shape that I can drag and zoom, plus a face guide oval for the photo.
4. Compress to just under the KB limit (count 1 KB as 1024 bytes, like Windows does): lower the JPEG quality step by step and shrink the size only if that isn't enough. Show the final size in KB and pixels and whether it passes.
5. Add my own custom preset, saved in the browser.
6. Download the finished photo and signature.

Done when: output meets the rules of 3 real forms; the file details on my computer confirm the size in KB; a large phone photo (12 MP) works with Wi-Fi off.

Rules: plain HTML, CSS and JavaScript with no framework and no build step. It must work fully offline: no CDN, no paid API, no login (if you need a library, save its file inside the folder). Make it look good: clear layout, readable text, buttons that say what they do, works on phone and laptop, no gradients or emojis. Keep the code short and easy to read. Add a short README.md: what it is, how to run or install it, the features, and the 'Done when' list with how to check each one. Don't run git commands and don't use the browser preview pane; I'll test it myself. First save this message word for word in prompts.md under '## Prompt 1 - build'. When you're done, reply with the file list and what I should test.

## Prompt 2 - fix 1

Fix 1: I tested it with a 12 MP photo. IBPS, GATE and UPSC all pass. But with a custom preset of photo 800 x 1000 px and 10-40 KB, it stopped lowering quality at 40%, then shrank the photo to 525 x 656 and showed "Does not pass: pixels do not match the rule". When a preset needs an exact pixel size, shrinking can never pass. For exact-size presets, keep the pixel size and keep lowering the JPEG quality (down to about 10%); only shrink for presets where the pixel size is a range or isn't given, and stay inside the allowed range. If even the lowest quality is too big, show a clear message saying why (very detailed or noisy photo) and what to do. Add this message to prompts.md as '## Prompt 2 - fix 1'. Don't run git or use the browser preview pane.
