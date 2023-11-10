class VPDESlider extends HTMLElement {
  constructor() {
    super();

    // Get the associated iframe(s), and create a message template to send to it.
    this.attachedFrames = this.getAttribute("iframe")
      .split(" ")
      .map((frame) => document.getElementById(frame));
    this.message = { name: this.getAttribute("name") };
    // Specify a custom host if one is provided, otherwise use the default.
    this.host = this.getAttribute("host") || "https://visualpde.com";

    // Create a slider and a name tag in a span.
    const wrapper = document.createElement("span");
    wrapper.style.setProperty("white-space", "nowrap");
    const label = wrapper.appendChild(document.createElement("span"));
    label.innerHTML = this.getAttribute("label") || "";

    // If a min label is provided, add it to the wrapper.
    if (this.getAttribute("min-label")) {
      const minLabel = wrapper.appendChild(document.createElement("span"));
      minLabel.innerHTML = " " + this.getAttribute("min-label");
      minLabel.classList.add("vpde-slider-valLabel");
    }

    // Create a slider input element, set its attributes, add it to the wrapper, and add an input event listener to it
    const slider = wrapper.appendChild(document.createElement("input"));
    slider.type = "range";
    slider.setAttribute("min", this.getAttribute("min") || 0);
    slider.setAttribute("max", this.getAttribute("max") || 1);
    slider.setAttribute("value", this.getAttribute("value") || 0.5);
    slider.step = this.getAttribute("step") || (slider.max - slider.min) / 20;
    slider.addEventListener("input", this.onInput.bind(this));

    // If a max label is provided, add it to the wrapper.
    if (this.getAttribute("max-label")) {
      const maxLabel = wrapper.appendChild(document.createElement("span"));
      maxLabel.innerHTML = this.getAttribute("max-label");
      maxLabel.classList.add("vpde-slider-valLabel");
    }

    // Configure the slider for formatting.
    slider.classList.add("vpde-slider");
    slider.classList.add("slider-progress");
    slider.style.setProperty("--value", slider.value);
    slider.style.setProperty("--min", slider.min);
    slider.style.setProperty("--max", slider.max);

    this.slider = slider;

    // Add an event listener to the iframe so that it gets sent the current value when loaded.
    this.attachedFrames.forEach((frame) => {
      frame.addEventListener("load", this.sendUpdate.bind(this));
    });

    this.append(wrapper);

    // If MathJax is loaded, typeset the label.
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
    this.attachedFrames.forEach((frame) => {
      frame.contentWindow.postMessage(this.message, this.host);
    });
  }
}

customElements.define("vpde-slider", VPDESlider);
