---
layout: demo
lesson_number: 10
title: Flooding Oxford - rain
thumbnail: /assets/images/flooding.webp
sim: "/sim/?preset=floodingOxford&story&no_ui&lite"
---

<div>
    <h1>Urban flood management</h1>
    <h3>Click to add heavy rainfall, or drag the slider to <br> emulate a large-scale flood</h3>
    <p><vpde-reset iframe="sim"></vpde-reset></p>
</div>
<p style="text-align:center;margin-bottom:0;"><vpde-slider
    iframe="sim"
    name="r"
    label="River level"
    label-position="above"
    min-label="Normal"
    max-label="Surge"
    min="0.01"
    max="2"
    value="0.01"
    step="0.01"
></vpde-slider></p>
