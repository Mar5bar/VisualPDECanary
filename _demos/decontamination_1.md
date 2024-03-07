---
layout: demo
lesson_number: 70
title: Chemical decontamination - click to cleanse
thumbnail: /assets/images/Decontamination.webp
---

<!-- Simulation -->
<iframe id="simA" class="sim" src="/sim/?preset=DecontaminationDemoSpots&story&lite&no_ui" frameborder="0" loading="lazy"></iframe>

<!-- Sliders -->
<div style="display:flex;flex-direction:column;row-gap:10dvh;">
<div>
    <h1>Cleaning up chemical spills</h1>
    <h3>Click to add cleanser to this side view<br> of contaminated concrete</h3>
    <p><vpde-reset iframe="simA"></vpde-reset></p>
</div>
<p style="text-align:center;margin-bottom:0;"><vpde-slider
    iframe="simA"
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
</div>
