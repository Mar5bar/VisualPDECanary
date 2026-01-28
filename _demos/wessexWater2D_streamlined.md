---
layout: page
title: Caring for our water
lesson_number: 110
thumbnail: /assets/images/bacteriaInFlow.webp
extract: Community action for improving water quality
equation:
---

<script src="/sim/scripts/charts.umd.min.js"></script>
<script src="/assets/js/vpde-charts.js"></script>

<style>
hr {
    width: 75%;
    margin: 20px auto;
}
.active {
    background-color: #007BFF;
    color: white;
}
button {
    background-color: #e7e7e7;
    color: black;
    border: none;
    border-radius: 5px;
    padding: 10px 24px;
    cursor: pointer;
}
.slider-group {
    display: grid;
    grid-template-columns: 1fr;
    gap: 20px;
    max-width: 800px;
    margin: 0 auto 20px auto;
    text-align: center;
}
@media (min-width: 768px) {
    .slider-group {
        grid-template-columns: repeat(2, 1fr);
    }
}
</style>

When it rains in urban areas, water often makes its way into the sewer system. During heavy rainfall, the volume of water can exceed the capacity of the sewer system, leading to tanks overflowing into nearby rivers and streams.

Below, there is a simulation that illustrates bathing water quality in a river affected by occasional discharges from storm overflow tanks. Press the 'Heavy rain' button to simulate a period of continuous heavy rainfall, which increases the flow rate in the river and causes discharges from the overflow tanks. This causes water quality to deteriorate downstream, indicated by darker colours in the simulation.

<div style="text-align:center;margin:20px 0;">
<button id="buttonA" onclick="customHandler.call(this,'simA', 'rainA', 'buttonA')" style="padding:10px 20px; font-size:16px;">
    Heavy rain
</button>
</div>
<div class="sim" style="position:relative; display:block; aspect-ratio:1.5/1; margin-bottom:20px;">
    <iframe id="simA" src="/sim/?preset=bacteriaInAReach2DIllustrated&story&reset_only&colourbar=true" frameborder="0" loading="lazy" style="width:100%; height:100%; position:absolute;"></iframe>
    <div id="rainA" style="position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; background: url('/assets/images/rain.gif'); opacity:0; transition: opacity 0.5s ease;"></div>
</div>

<h2> Improving water quality with community action </h2>
There are lots of ways that the community can help to reduce the impacts of heavy rainfall. One way is to use water butts to collect rainwater from roofs, which can then be used for gardening or other non-potable uses. This reduces the amount of water entering the sewer system during heavy rainfall, helping to prevent overflows. 
<p style="text-align:center;margin-bottom:0;"><vpde-slider
    iframe="simA"
    name="b"
    label="Water butts in the community"
    label-position="above"
    min="0"
    max="1"
    value="0"
    step="0.01"
    min-label="Uncommon"
    max-label="Common"
></vpde-slider></p>
Trying adjusting the number of water butts in the community using the slider above to see how this affects water quality in the river during heavy rain events. Don't forget to press the "Heavy rain" button again to see the effects!

<hr>

<h2> A complex system </h2>
In reality, the interactions between rainfall, sewer systems, and river water quality are complex. There are many other community-scale interventions that can help to reduce the impacts of heavy rainfall, including picking up animal waste, maintaining septic tanks, and ... . These interventions can help to reduce the amount of water entering the sewer system during heavy rainfall, improving water quality in rivers and streams.

We've included some of these complexities in the simulation below. Drag the various sliders to see how many different factors can influence water quality in the river during heavy rainfall. Press the "Heavy rain" button below to see the effects.

<div style="text-align:center;margin:20px 0;">
<button id="buttonB" onclick="customHandler.call(this,'simB', 'rainB', 'buttonB')" style="padding:10px 20px; font-size:16px;">
    Heavy rain
</button>
</div>
<div class='slider-group'>
    <vpde-slider
        iframe="simB"
        name="b"
        label="Water butts in the community"
        label-position="above"
        min="0"
        max="1"
        value="0"
        step="0.01"
        min-label="Uncommon"
        max-label="Common"
    ></vpde-slider>
    <vpde-slider
        iframe="simB"
        name="w"
        label="Animal waste"
        label-position="above"
        min="0"
        max="1"
        value="0"
        step="0.01"
        min-label="Uncollected"
        max-label="Removed"
    ></vpde-slider>
    <vpde-slider
        iframe="simB"
        name="s"
        label="Septic tank maintenance"
        label-position="above"
        min="0"
        max="1"
        value="0"
        step="0.01"
        min-label="Poor"
        max-label="Good"
    ></vpde-slider>
    <vpde-slider
        iframe="simB"
        name="o"
        label="Other intervention"
        label-position="above"
        min="0"
        max="1"
        value="0"
        step="0.01"
        min-label="Uncommon"
        max-label="Common"
    ></vpde-slider>
</div>
<div class="sim" style="position:relative; display:block; aspect-ratio:1.5/1; margin-bottom:20px;">
    <iframe id="simB" src="/sim/?preset=bacteriaInAReach2DIllustrated&story&reset_only&colourbar=true" frameborder="0" loading="lazy" style="width:100%; height:100%; position:absolute;"></iframe>
    <div id="rainB" style="position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; background: url('/assets/images/rain.gif'); opacity:0; transition: opacity 0.5s ease;"></div>
</div>

<h2> FAQs </h2>
<strong>Q: Why does heavy rain affect water quality in rivers?</strong>
<br>
A: During heavy rainfall, the volume of water entering the sewer system can exceed its capacity. This can lead to overflows from storm tanks, which discharge untreated sewage into nearby rivers and streams, introducing harmful bacteria and pollutants that degrade water quality.
<br><br>
<strong>Q: How do water butts help improve water quality during heavy rain?</strong>
<br>A: Water butts collect rainwater from roofs, reducing the amount of water that enters the sewer system during heavy rainfall. By lowering the volume of water in the sewers, water butts help prevent overflows from storm tanks, thereby reducing the risk of untreated sewage being discharged into rivers and improving water quality.
<br><br>
<strong>Q: Can individual actions like using water butts really make a difference?</strong>
<br>A: Yes, individual actions can collectively have a significant impact. When many households use water butts, the cumulative reduction in water entering the sewer system can help prevent overflows during heavy rainfall events, leading to better water quality in local rivers and streams.
<br><br>
<strong>Q: Are these simulations based on real data?</strong>
<br>A: The simulations are simplified models designed for educational purposes. While they capture key concepts related to water quality and sewer overflows, they do not incorporate all the complexities of real-world systems. They are intended to illustrate how factors like rainfall and community actions can influence water quality in rivers, rather than provide precise predictions.

<!-- <div style="text-align:center">
<vpde-select
      iframe="simA"
      display-names="Summer; Winter"
      parameters="k=0.006; k=0.001"
></vpde-select>
</div> -->
<!-- Adjust the season via the dropdown menu above. In summer, longer days and sunnier conditions lead to faster bacterial decay rates, improving water quality downstream. In winter, lower temperatures slow decay, resulting in higher bacteria levels overall. -->

<!-- A hidden select element for triggering heavy rain -->

<vpde-select
id="heavyRainSelectA"
iframe="simA"
style="display:none;"
display-names="Normal; Heavy rain"
parameters="u=1, c1=0; u=1.25-0.1*b, c1=0.5-0.3*b"

> </vpde-select>

<vpde-select
id="heavyRainSelectB"
iframe="simB"
style="display:none;"
display-names="Normal; Heavy rain"
parameters="u=1, c1=0; u=1.25-0.1*b, c1=0.5-0.3*b"

> </vpde-select>

<script>
let storm = {"A": false, "B": false};
function customHandler(sim, rain, button) {
    sim = sim || 'simA';
    rain = rain || 'rainA';
    const key = sim === 'simA' ? 'A' : 'B';
    storm[key] = !storm[key];
    this.classList.toggle('active', storm[key]);
    const iframe = document.getElementById(sim);
    // Post a message to the iframe to trigger the heavy rain event by changing a parameter.
    const select = document.getElementById('heavyRainSelect' + (key)).select;
    if (storm[key]) {
        // Activate heavy rain
        select.selectedIndex = 1;
        document.getElementById(rain).style.opacity = '0.4';
        document.getElementById(sim).style.filter = 'grayscale(0.2)';
    } else {
        // Deactivate heavy rain
        select.selectedIndex = 0;
        document.getElementById(rain).style.opacity = '0';
        document.getElementById(sim).style.filter = '';
    }
    // Trigger the change event
    const event = new Event('change');
    select.dispatchEvent(event);
}
</script>
