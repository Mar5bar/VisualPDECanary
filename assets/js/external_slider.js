class VPDESlider extends HTMLElement {
  constructor() {
    super();

    this.attachedFrame = document.getElementById(this.getAttribute("iframe"));
    this.message = { name: this.getAttribute("name") };

    // Create a slider and a name tag in a span.
    const wrapper = document.createElement("span");
    const label = wrapper.appendChild(document.createElement("span"));
    label.innerHTML = this.hasAttribute("name")
      ? "$" + this.getAttribute("name") + "$"
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
    slider.addEventListener("input", this.sendUpdate.bind(this));
    this.slider = slider;

    this.append(wrapper);

    if (MathJax.typesetPromise != undefined) {
      MathJax.typesetPromise();
    }
  }

  // Send an update to the associated simulation.
  sendUpdate() {
    this.message.value = this.slider.value;
    this.attachedFrame.contentWindow.postMessage(this.message);
  }
}

customElements.define("vpde-slider", VPDESlider);
