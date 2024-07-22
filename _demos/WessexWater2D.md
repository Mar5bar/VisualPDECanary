---
layout: demo
lesson_number: 120
title: Water quality in 2D 
thumbnail: /assets/images/bacteriaInFlow.webp
sim: "/sim/?preset=bacteriaInAReach2D&story&no_ui&lite"
extract: Transport along rivers in 2D
---

<div>
    <h1>Water quality</h1>
    <h3>Click to add bacteria or drag the sliders<br> to modify the conditions</h3>
    <p><vpde-reset iframe="sim"></vpde-reset></p>
</div>
<p style="text-align:center;margin-bottom:0;"><vpde-slider
    iframe="sim"
    name="c0"
    label="Upstream concentration"
    label-position="above"
    min-label="Low"
    max-label="High"
    min="0"
    max="1"
    value="0.1"
    step="0.01"
></vpde-slider>
<vpde-slider
    iframe="sim"
    name="k"
    label="Decay rate"
    label-position="above"
    min-label="Low"
    max-label="High"
    min="0"
    max="0.1"
    value="0.006"
    step="0.001"
></vpde-slider>
<vpde-slider
    iframe="sim"
    name="u"
    label="Flow rate"
    label-position="above"
    min-label="Low"
    max-label="High"
    min="0.1"
    max="4"
    value="1"
    step="0.1"
></vpde-slider>
<vpde-slider
    iframe="sim"
    name="c1"
    label="Agriculture"
    label-position="above"
    min-label="Low"
    max-label="High"
    min="0"
    max="1"
    value="0"
    step="0.01"
></vpde-slider></p>

<script>
    document.querySelector('iframe').style.height = '50dvh';
    document.querySelector('iframe').style.width = '70vw';
    document.getElementById("main").style.maxWidth = "400px";
</script>
