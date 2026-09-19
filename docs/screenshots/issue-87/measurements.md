# Issue #87: what the walk measured

Written by `tests/first-tree/walk.spec.ts` (the #87 block). Window, document and body are
`width x height` (the document and the body as `scrollWidth x scrollHeight`); "overflowing"
counts the elements other than the Carousel strip whose content is larger than
themselves (application.md 10.6).

| page | lang | window | document | body | overflowing | also measured |
|---|---|---|---|---|---|---|
| start | en | 1280 x 640 | 1280 x 640 | 1280 x 640 | 0 | Answer buttons 620 x 60, radius 999px, fill rgb(21, 154, 47), label rgb(255, 255, 255) 19px 700 |
| start, "provider" hovered | en | 1280 x 640 | 1280 x 640 | 1280 x 640 | 0 | explainer panel 320 x 146 |
| article-2-exclusions, Overlay on the research exclusion | en | 1280 x 640 | 1280 x 640 | 1280 x 640 | 0 | Overlay panel 760 x 608 |
| prohibited-practices, three steps in | en | 1280 x 640 | 1280 x 640 | 1280 x 640 | 0 |  |
| annex-i-legislation, the heaviest Node | en | 1280 x 640 | 1280 x 640 | 1280 x 640 | 0 | 10 requests, 9 pictures |
| annex-i-legislation-2, the fan | en | 1280 x 640 | 1280 x 640 | 1280 x 640 | 0 | 7 Option buttons 232 x 96, titles at 16px, left edges 965, 65, 1033, 8, 1033, 65, 965 |
| annex-i-legislation-2, after the copy-link click | en | 1280 x 640 | 1280 x 640 | 1280 x 640 | 0 | clipboard: http://127.0.0.1:3700/ai-act-applicability-agrifood/start/article-2-exclusions/ai-system-definition/prohibited-practices/prohibited-practices-2/annex-i-legislation/annex-i-legislation-2 |
| carousel fixture, five Images | en | 1280 x 640 | 1280 x 640 | 1280 x 640 | 0 | strip centre y 516, Bubble bottom 516 |
| start | nl | 1280 x 640 | 1280 x 640 | 1280 x 640 | 0 | Answer buttons 620 x 60, radius 999px, fill rgb(21, 154, 47), label rgb(255, 255, 255) 19px 700 |
| start, "provider" hovered | nl | 1280 x 640 | 1280 x 640 | 1280 x 640 | 0 | explainer panel 320 x 166 |
| article-2-exclusions, Overlay on the research exclusion | nl | 1280 x 640 | 1280 x 640 | 1280 x 640 | 0 | Overlay panel 760 x 608 |
| prohibited-practices, three steps in | nl | 1280 x 640 | 1280 x 640 | 1280 x 640 | 0 |  |
| annex-i-legislation, the heaviest Node | nl | 1280 x 640 | 1280 x 640 | 1280 x 640 | 0 | 10 requests, 9 pictures |
| annex-i-legislation-2, the fan | nl | 1280 x 640 | 1280 x 640 | 1280 x 640 | 0 | 7 Option buttons 232 x 96, titles at 16px, left edges 965, 65, 1033, 8, 1033, 65, 965 |
| annex-i-legislation-2, after the copy-link click | nl | 1280 x 640 | 1280 x 640 | 1280 x 640 | 0 | clipboard: http://127.0.0.1:3700/ai-act-applicability-agrifood/start/article-2-exclusions/ai-system-definition/prohibited-practices/prohibited-practices-2/annex-i-legislation/annex-i-legislation-2?lang=nl |
| carousel fixture, five Images | nl | 1280 x 640 | 1280 x 640 | 1280 x 640 | 0 | strip centre y 516, Bubble bottom 516 |
| start | en | 1920 x 1080 | 1920 x 1080 | 1920 x 1080 | 0 | Answer buttons 620 x 60, radius 999px, fill rgb(21, 154, 47), label rgb(255, 255, 255) 19px 700 |
| start, "provider" hovered | en | 1920 x 1080 | 1920 x 1080 | 1920 x 1080 | 0 | explainer panel 320 x 146 |
| article-2-exclusions, Overlay on the research exclusion | en | 1920 x 1080 | 1920 x 1080 | 1920 x 1080 | 0 | Overlay panel 760 x 608 |
| prohibited-practices, three steps in | en | 1920 x 1080 | 1920 x 1080 | 1920 x 1080 | 0 |  |
| annex-i-legislation, the heaviest Node | en | 1920 x 1080 | 1920 x 1080 | 1920 x 1080 | 0 | 10 requests, 9 pictures |
| annex-i-legislation-2, the fan | en | 1920 x 1080 | 1920 x 1080 | 1920 x 1080 | 0 | 7 Option buttons 232 x 96, titles at 16px, left edges 1272, 394, 1352, 328, 1352, 394, 1272 |
| annex-i-legislation-2, after the copy-link click | en | 1920 x 1080 | 1920 x 1080 | 1920 x 1080 | 0 | clipboard: http://127.0.0.1:3700/ai-act-applicability-agrifood/start/article-2-exclusions/ai-system-definition/prohibited-practices/prohibited-practices-2/annex-i-legislation/annex-i-legislation-2 |
| carousel fixture, five Images | en | 1920 x 1080 | 1920 x 1080 | 1920 x 1080 | 0 | strip centre y 773, Bubble bottom 773 |
| start | nl | 1920 x 1080 | 1920 x 1080 | 1920 x 1080 | 0 | Answer buttons 620 x 60, radius 999px, fill rgb(21, 154, 47), label rgb(255, 255, 255) 19px 700 |
| start, "provider" hovered | nl | 1920 x 1080 | 1920 x 1080 | 1920 x 1080 | 0 | explainer panel 320 x 166 |
| article-2-exclusions, Overlay on the research exclusion | nl | 1920 x 1080 | 1920 x 1080 | 1920 x 1080 | 0 | Overlay panel 760 x 608 |
| prohibited-practices, three steps in | nl | 1920 x 1080 | 1920 x 1080 | 1920 x 1080 | 0 |  |
| annex-i-legislation, the heaviest Node | nl | 1920 x 1080 | 1920 x 1080 | 1920 x 1080 | 0 | 10 requests, 9 pictures |
| annex-i-legislation-2, the fan | nl | 1920 x 1080 | 1920 x 1080 | 1920 x 1080 | 0 | 7 Option buttons 232 x 96, titles at 16px, left edges 1272, 394, 1352, 328, 1352, 394, 1272 |
| annex-i-legislation-2, after the copy-link click | nl | 1920 x 1080 | 1920 x 1080 | 1920 x 1080 | 0 | clipboard: http://127.0.0.1:3700/ai-act-applicability-agrifood/start/article-2-exclusions/ai-system-definition/prohibited-practices/prohibited-practices-2/annex-i-legislation/annex-i-legislation-2?lang=nl |
| carousel fixture, five Images | nl | 1920 x 1080 | 1920 x 1080 | 1920 x 1080 | 0 | strip centre y 773, Bubble bottom 773 |

## Requests on arriving at the heaviest Node, annex-i-legislation, by a click

- en, 1280 x 640: 10 requests, 9 of them image files
  - `fetch /ai-act-applicability-agrifood/start/article-2-exclusions/ai-system-definition/prohibited-practices/prohibited-practices-2/annex-i-legislation?_rsc=yyVSJ3mzSeSC7pB-`
  - `image /images/step-annex-i.jpg`
  - `image /images/toys.jpg`
  - `image /images/recreational-craft.jpg`
  - `image /images/lifts.jpg`
  - `image /images/explosive-atmospheres.jpg`
  - `image /images/radio-equipment.jpg`
  - `image /images/pressure-equipment.jpg`
  - `image /images/cableway-installations.jpg`
  - `image /images/personal-protective-equipment.jpg`
- nl, 1280 x 640: 10 requests, 9 of them image files
  - `fetch /ai-act-applicability-agrifood/start/article-2-exclusions/ai-system-definition/prohibited-practices/prohibited-practices-2/annex-i-legislation?lang=nl&_rsc=Uq1GeAeJA1U3HWw7`
  - `image /images/step-annex-i.jpg`
  - `image /images/toys.jpg`
  - `image /images/recreational-craft.jpg`
  - `image /images/lifts.jpg`
  - `image /images/explosive-atmospheres.jpg`
  - `image /images/radio-equipment.jpg`
  - `image /images/pressure-equipment.jpg`
  - `image /images/cableway-installations.jpg`
  - `image /images/personal-protective-equipment.jpg`
- en, 1920 x 1080: 10 requests, 9 of them image files
  - `fetch /ai-act-applicability-agrifood/start/article-2-exclusions/ai-system-definition/prohibited-practices/prohibited-practices-2/annex-i-legislation?_rsc=yyVSJ3mzSeSC7pB-`
  - `image /images/step-annex-i.jpg`
  - `image /images/toys.jpg`
  - `image /images/recreational-craft.jpg`
  - `image /images/lifts.jpg`
  - `image /images/explosive-atmospheres.jpg`
  - `image /images/radio-equipment.jpg`
  - `image /images/pressure-equipment.jpg`
  - `image /images/cableway-installations.jpg`
  - `image /images/personal-protective-equipment.jpg`
- nl, 1920 x 1080: 10 requests, 9 of them image files
  - `fetch /ai-act-applicability-agrifood/start/article-2-exclusions/ai-system-definition/prohibited-practices/prohibited-practices-2/annex-i-legislation?lang=nl&_rsc=Uq1GeAeJA1U3HWw7`
  - `image /images/step-annex-i.jpg`
  - `image /images/toys.jpg`
  - `image /images/recreational-craft.jpg`
  - `image /images/lifts.jpg`
  - `image /images/explosive-atmospheres.jpg`
  - `image /images/radio-equipment.jpg`
  - `image /images/pressure-equipment.jpg`
  - `image /images/cableway-installations.jpg`
  - `image /images/personal-protective-equipment.jpg`
