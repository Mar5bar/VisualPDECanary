---
layout: page
title: Water quality v2
lesson_number: 110
thumbnail: /assets/images/bacteriaInFlow.webp
extract: Transport along rivers
equation:
---

<script src="/sim/scripts/charts.umd.min.js"></script>
<script src="/assets/js/vpde-charts.js"></script>



Adjust the slider to control how much investment is made in water treatment upstream. Higher investment reduces the concentration of bacteria entering the river, improving water quality downstream. Lower investment leads to higher bacteria levels, which could pose risks to bathers' health.

<p style="text-align:center;margin-bottom:0;"><vpde-slider
    iframe="simA"
    name="c0"
    label="Investment in treatment"
    label-position="above"
    min="0.01"
    max="1"
    value="0.5"
    step="0.01"
    min-label="Low"
    max-label="High"
></vpde-slider></p>
<iframe class="sim" id="simA" src="/sim/?preset=bacteriaInAReach2DIllustrated&story&reset_only&colourbar=true" frameborder="0" loading="lazy" style="aspect-ratio:1.5/1"></iframe>


<div style="text-align:center">
<vpde-select
      iframe="simA"
      display-names="Summer; Winter"
      parameters="k=0.006; k=0.001"
></vpde-select>
</div>
Adjust the season via the dropdown menu above. In summer, longer days and sunnier conditions lead to faster bacterial decay rates, improving water quality downstream. In winter, lower temperatures slow decay, resulting in higher bacteria levels overall.

### Footnotes