---
layout: demo
lesson_number: 70
title: Chemical decontamination - click to cleanse
thumbnail: /assets/images/Decontamination.webp
sim: "/sim/?preset=DecontaminationDemoSpots&story&lite&no_ui"
---

<!-- Sliders -->
<div>
    <h1>Cleaning up chemical spills</h1>
    <h3>Click to add cleanser to this side view<br> of contaminated concrete</h3>
    <p><vpde-reset iframe="sim"></vpde-reset></p>
</div>
<p style="text-align:center;margin-bottom:0;"><vpde-slider
    iframe="sim"
    name="k"
    label="Cleanser strength"
    label-position="above"
    min="0.01"
    max="0.5"
    value="0.25"
    step="0.01"
    min-label="Weak"
    max-label="Strong"
></vpde-slider></p>
