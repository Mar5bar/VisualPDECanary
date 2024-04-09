---
layout: page
title: Wessex Water tech demo
lesson_number: 110
thumbnail: /assets/images/flooding.webp
extract: Transport along rivers
equation:
---
 
<iframe class="sim" id="simA" src="/sim/?preset=bacteriaInAReach&story&lite&sf=1&clean" frameborder="0" loading="lazy"></iframe>
<p style="text-align:center;margin-top:0;"><vpde-slider
    iframe="simA"
    name="c0"
    label="Inlet concentration"
    min="0.01"
    max="1"
    value="0.5"
    step="0.01"
    min-label="Low"
    max-label="High"
></vpde-slider></p>
<p style="text-align:center;margin-top:0;"><vpde-slider
    iframe="simA"
    name="k"
    label="Decay"
    min="0"
    max="0.02"
    value="0.001"
    step="0.0001"
    min-label="None"
    max-label="Maximum"
></vpde-slider></p>
<p style="text-align:center;margin-top:0;"><vpde-slider
    iframe="simA"
    name="u"
    label="Flow"
    min="0.1"
    max="2"
    value="0.62"
    step="0.01"
    min-label="Low"
    max-label="High"
></vpde-slider></p>

