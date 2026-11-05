# Form Photo Fixer

A small web app that turns your photo and signature into files that meet the rules of Indian exam and job application forms. Plain HTML, CSS and JavaScript. No framework, no build step, no internet needed, no login.

## How to run

1. Double-click `index.html` (it opens in Chrome, Edge, Firefox or Safari). That is all.
2. On a phone, copy the folder to the phone and open `index.html` in the browser, or host the folder on any static server once. After the first load it needs no network.

There is nothing to install and no external file is loaded (no CDN, no fonts, no API). Your pictures never leave your device.

## Features

- Upload a photo and a signature (any phone or camera picture, including 12 MP).
- Presets for IBPS RRB, GATE 2027, UPSC CAPF (AC) and SSC CHSL (signature only), using the numbers from the official notices.
- Crop box locked to the preset's shape. Drag the picture under the box, zoom with the slider, mouse wheel or two fingers. The photo has a face guide oval.
- Compression to just under the KB limit (1 KB = 1024 bytes, like Windows): JPEG quality goes down in 2% steps from 98%. Presets with an exact pixel size keep that size and lower quality down to 10%. Presets with a pixel range or no pixel rule lower quality to 30%, then shrink by 10% steps but never below the allowed range. If the result is below the minimum KB, harmless JPEG comment bytes are added to reach it.
- Shows final size in KB (and bytes), pixels, JPEG quality, and a clear pass or does-not-pass message.
- Custom presets (name, pixels, min/max KB for photo and signature), saved in the browser with `localStorage`, and can be deleted.
- Download buttons for the finished photo and signature (JPG).

## Form rules

Checked on 5 Nov 2026 from the official documents. Rules change, so compare with the current notice before you submit.

| Preset | Photo | Signature | Official source |
|---|---|---|---|
| IBPS RRB (CRP RRBs XV) | 200 x 230 px (preferred), 20-50 KB | 140 x 60 px (preferred), 10-20 KB | [CRP RRBs XV notification](https://www.ibps.in/wp-content/uploads/CRP-RRBs-XV-notification.pdf) (guidelines for photograph and signature) |
| GATE 2027 | 3.5 x 4.5 cm, 200 x 260 to 530 x 690 px, 5-600 KB, JPG. The app makes 413 x 531 px | 250 x 80 to 580 x 180 px, 3-300 KB, JPG. The app makes 450 x 140 px | [GATE 2027 photograph and signature](https://gate2027.iitm.ac.in/photograph_and_signature) |
| UPSC CAPF (AC) 2026 | 20-200 KB, .jpg. No pixel size is given, the app uses 350 x 450 px | 20-100 KB, .jpg. No pixel size is given, the app uses 500 x 200 px | [Examination Notice No. 08/2026-CAPF, 20.02.2026](https://www.upsc.gov.in/sites/default/files/ExamNotifi_CAPF_AC_Exam_2026_Eng_20022026.pdf) |
| SSC CHSL 2026 (signature only) | Taken live by the form's camera, no upload | JPEG, 10-20 KB, about 6.0 x 2.0 cm. The app makes 354 x 118 px | [SSC CHSL 2026 notice, 07.09.2026](https://ssc.gov.in/api/attachment/uploads/masterData/NoticeBoards/Notice_of_adv_chsle_2026.pdf) (paragraph 9.6) |

Notes:
- The UPSC notice says "not exceed 200 KB and not less than 20 KB" (photo) and "100 KB / 20 KB" (signature). Older UPSC pages show 300 KB, and other UPSC exams may differ. Check the notice of your exam.
- GATE also asks for the face to fill 60-70% of the photo and a white background. The oval is a guide for this.
- SSC asks for a live photo, so only the signature is processed for that preset.

## Done when (and how to check each)

1. **Output meets the rules of 3 real forms.** Pick IBPS RRB, GATE 2027 and UPSC CAPF in turn. Load a photo and a signature each time. The green box must say "Passes", and the numbers must match the table above.
2. **File details on your computer confirm the size in KB.** Download the file, right-click it in Windows, choose Properties. "Size" (for example "48.9 KB") must match the app and be inside the limit. (Windows shows the size in KB with 1 KB = 1024 bytes. "Size on disk" is different, ignore it.)
3. **A 12 MP phone photo works with Wi-Fi off.** Turn Wi-Fi off, open `index.html`, choose a full-size phone photo, crop, and download. It should work the same, because the app uses no network.

## Files

- `index.html` page layout
- `style.css` look and layout
- `app.js` presets, crop, compression, custom presets, download
- `prompts.md` the prompt this was built from
