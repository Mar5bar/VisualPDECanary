---
layout: page
title: Ripples on a pond
lesson_number: 10
thumbnail: /assets/images/ShallowWaterBox.webp
extract: Exploring the chemical basis of morphogenesis
equation:
categories: [visual stories]
---
In this Story, STUFF

# TITLE

* LIST

 At any time, you can reset the simulation by pressing <vpde-reset iframe="simA"></vpde-reset>

<p style="text-align:center;margin-bottom:0;"><vpde-slider
    iframe="simGM"
    name="D"
    label="Inhibitor diffusion rate"
    label-position="above"
    min-label="Small"
    max-label="Large"
    min="45"
    max="100"
    value="45"
    step="5"
></vpde-slider></p>

<p style="text-align:center;margin-bottom:0;"><vpde-slider
    iframe="simGM"
    name="K"
    label="Activator Saturation"
    label-position="below"
    min-label="Normal"
    max-label="Improved"
    min="0"
    max="0.005"
    value="0.001"
></vpde-slider></p>

<iframe id="simGM" class="sim" style="margin-left:auto;margin-right:auto" src="/sim/?preset=GiererMeinhardtStripeiframe&story&reset_only" frameborder="0" loading="lazy"></iframe>