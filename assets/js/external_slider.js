class VPDESlider extends HTMLElement {
  constructor() {
    super();

    this.attachedFrame = document.getElementById(this.getAttribute("iframe"));
    this.message = { name: this.getAttribute("name") };

    // Create a slider and a name tag in a span.
    const wrapper = document.createElement("span");
    const label = wrapper.appendChild(document.createElement("span"));
    label.innerHTML = this.hasAttribute("label")
      ? this.getAttribute("label")
      : "";

    const slider = wrapper.appendChild(document.createElement("input"));
    slider.classList.add("styled-slider");
    slider.classList.add("slider-progress");
    slider.type = "range";
    slider.min = this.hasAttribute("min") ? this.getAttribute("min") : 0;
    slider.max = this.hasAttribute("max") ? this.getAttribute("max") : 1;
    slider.value = this.hasAttribute("value")
      ? this.getAttribute("value")
      : 0.5;
    slider.step = this.hasAttribute("step")
      ? this.getAttribute("step")
      : (slider.max - slider.min) / 20;
    slider.addEventListener("input", this.onInput.bind(this));
    // Configure the slider style for formatting.
    slider.style.setProperty("--value", slider.value);
    slider.style.setProperty("--min", slider.min);
    slider.style.setProperty("--max", slider.max);

    this.slider = slider;

    // Add an event listener to the iframe so that it gets sent the current value when loaded.
    this.attachedFrame.addEventListener("load", this.sendUpdate.bind(this));

    this.append(wrapper);

    if (MathJax.typesetPromise != undefined) {
      MathJax.typesetPromise();
    }
  }

  onInput() {
    this.slider.style.setProperty("--value", this.slider.value);
    this.sendUpdate();
  }

  // Send an update to the associated simulation.
  sendUpdate() {
    this.message.value = this.slider.value;
    this.attachedFrame.contentWindow.postMessage(this.message);
  }
}

customElements.define("vpde-slider", VPDESlider);
