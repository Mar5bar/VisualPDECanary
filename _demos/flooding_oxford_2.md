---
layout: demo
lesson_number: 20
title: Flooding Oxford - absorption
thumbnail: /assets/images/flooding.webp
---

<!-- Simulation -->
<iframe id="simB" class="sim" src="/sim/?preset=floodingOxford&story&reset_only" frameborder="0" loading="lazy"></iframe>

<!-- Sliders -->
<div style="display:flex;flex-direction:column;row-gap:10dvh;">
<p style="text-align:center;margin-bottom:0;"><vpde-slider
    iframe="simB"
    name="r"
    label="Flow rate"
    label-position="above"
    min-label="Normal"
    max-label="Surge"
    min="0.01"
    max="2"
    value="0.01"
    step="0.01"
></vpde-slider></p>
    <p style="text-align:center;margin-bottom:0;"><vpde-slider
    iframe="simB"
    name="a"
    label="Absorption"
    label-position="below"
    min-label="Normal"
    max-label="Improved"
    min="0.001"
    max="0.02"
    value="0.001"
></vpde-slider></p>
</div>
