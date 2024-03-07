---
layout: demo
lesson_number: 30
title: Flooding Oxford - diversion
thumbnail: /assets/images/flooding.webp
---

<!-- Simulation -->
<iframe id="simC" class="sim" src="/sim/?preset=floodingOxford&story&reset_only&whatToDraw=T&brushValue=-10&brushRadius=10" frameborder="0" loading="lazy"></iframe>

<!-- Sliders -->
<div style="display:flex;flex-direction:column;row-gap:10dvh;">
<p style="text-align:center;margin-bottom:0;"><vpde-slider
    iframe="simC"
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
</div>
