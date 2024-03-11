---
layout: demo
lesson_number: 90
title: Mask dynamics - breathing
thumbnail: /assets/images/maskFront.webp
sim: "/sim/?preset=maskFrontBreathing&story&no_ui&lite&colourbar=true"
---

<div>
    <h1>Airflow behind a facemask</h1>
    <h3>Drag the slider to change the quality of the mask</h3>
    <p><vpde-reset iframe="sim"></vpde-reset></p>
</div>
<p style="text-align:center;margin-bottom:0;"><vpde-slider
    iframe="sim"
    name="k"
    label="Mask quality"
    label-position="above"
    min-label="High"
    max-label="Low"
    min="0.25"
    max="8"
    value="0.25"
    step="0.01"
    reversed="true"
></vpde-slider></p>
