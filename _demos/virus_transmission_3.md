---
layout: demo
lesson_number: 60
title: Virus transmission - circling
thumbnail: /assets/images/VirusTransmission.webp
sim: "/sim/?preset=CovidInARoomCircling&story&nomathjax&sf=1&activeViewInd=1&runningOnLoad=true&no_ui&colourbar=true"
---

<div>
    <h1>Airborne virus transmission</h1>
    <h3>Click to introduce virus to the air</h3>
    <p><vpde-reset iframe="sim"></vpde-reset></p>
</div>
<p style="text-align:center;margin-top:0;"><vpde-slider
    iframe="sim"
    name="V"
    label="Airflow"
    min="-40"
    max="40"
    value="40"
    step="1"
    min-label="Left"
    max-label="Right"
></vpde-slider></p>
