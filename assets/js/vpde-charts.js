// Dependencies: Chart.js
(function () {
  // Set default font and color for Chart.js.
  Chart.defaults.font.family = `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji",
    "Segoe UI Symbol"`;
  Chart.defaults.font.size = "11";

  // Get the text color from the CSS, or default to black.
  Chart.defaults.color =
    getComputedStyle(document.documentElement).getPropertyValue(
      "--text-color",
    ) || "black";
  if (document.documentElement.classList.contains("dark-mode")) {
    Chart.defaults.borderColor =
      getComputedStyle(document.documentElement).getPropertyValue(
        "--ui-button-border-color",
      ) || "white";
  }

  function shortestStringNum(num, depth) {
    num = parseFloat(num);
    const dec = num.toFixed(depth);
    const sig = num.toPrecision(depth);
    return dec.length < sig.length ? dec : sig;
  }

  // Create a custom element for the chart.
  class VPDEChart extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      // Get the associated iframe(s), and create a message template to send to it.
      this.frameIDs = this.getAttribute("iframe").split(" ");
      this.message = { type: "id" };
      // Specify a custom host if one is provided, otherwise use the default.
      this.host = this.getAttribute("host") || "https://visualpde.com";

      // Add a listener to the window that will send iframe IDs to the iframes on load.
      window.addEventListener(
        "load",
        (() => {
          if (this.frameIDs) this.sendIDs();
        }).bind(this),
      );

      // Create a container, a canvas object, and a chart attached to the canvas.
      const container = document.createElement("div");
      container.classList.add("vpde-chart-container");
      container.setAttribute(
        "style",
        this.getAttribute("style") || "position:relative",
      );
      this.appendChild(container);

      const canvas = document.createElement("canvas");
      container.appendChild(canvas);

      const chart = new Chart(canvas, {
        type: "line",
        options: {
          borderWidth: parseFloat(this.getAttribute("borderWidth")) || 2.5,
          borderColor:
            getComputedStyle(document.documentElement).getPropertyValue(
              "--link-color",
            ) || "blue",
          layout: { padding: { top: 17, right: 17 } },
          responsive: true,
          animation: false,
          maintainAspectRatio: false,
          parsing: false,
          scales: {
            x: {
              type: "linear",
              ticks: {
                maxTicksLimit: 2,
                callback: function (value, index, ticks) {
                  return "";
                },
              },
            },
            y: {
              type: "linear",
              grace: "5%",
              ticks: {
                maxTicksLimit: 10,
                callback: function (value, index, ticks) {
                  return shortestStringNum(value, 3);
                },
              },
            },
          },
          plugins: {
            legend: { display: false },
            tooltip: { enabled: false },
            decimation: {
              enabled: true,
              algorithm: "lttb",
              threshold: 200,
            },
          },
        },
        data: {
          datasets: [{ data: [], pointStyle: false }],
        },
      });
      chart.limMax = this.getAttribute("ymax") || -Infinity;
      chart.limMin = this.getAttribute("ymin") || Infinity;
      chart.dataStore = [];
      if (this.getAttribute("yticks") && this.getAttribute("yticks") == "false")
        chart.options.scales.y.ticks.display = false;

      // Listen for the data from the simulation.
      window.addEventListener("message", (event) => {
        const data = event.data;
        if (
          data.type === "probeData" && this.frameIDs
            ? this.frameIDs.includes(data.id)
            : true
        ) {
          chart.dataStore = data.data;
          let opts = chart.options.scales;
          opts.x.max = chart.dataStore.slice(-1)[0].x;
          opts.x.min = chart.dataStore[0].x;
          const value = chart.dataStore.slice(-1)[0].y;
          chart.limMin = Math.min(chart.limMin, value);
          chart.limMax = Math.max(chart.limMax, value);
          if (isNaN(value)) {
            chart.limMax = -Infinity;
            chart.limMin = Infinity;
          }
          opts.y.suggestedMin = chart.limMin;
          opts.y.suggestedMax = chart.limMax;
          chart.data.datasets[0].data = chart.dataStore;
          chart.update();
        }
      });

      // Add an optional label for the x-axis.
      const xLabel = this.getAttribute("xlabel") || "Time";
      const xLabelEl = document.createElement("div");
      xLabelEl.innerHTML = xLabel;
      xLabelEl.setAttribute(
        "style",
        "position: absolute;bottom: 4px;left: 50%;transform: translateX(-50%);font-size: 0.8rem;",
      );
      container.appendChild(xLabelEl);

      // Add an optional label for the y-axis.
      const yLabel = this.getAttribute("ylabel") || "";
      const yLabelEl = document.createElement("div");
      yLabelEl.innerHTML = yLabel;
      yLabelEl.setAttribute(
        "style",
        "position: absolute;left: -18px;top: 50%;transform: translateY(-50%) rotate(180deg);font-size: 0.8rem;writing-mode: vertical-rl;",
      );
      container.appendChild(yLabelEl);
    }

    // Send the ID of the simulation to the associated simulations.
    sendIDs() {
      this.frameIDs.forEach((frameID) => {
        this.message.id = frameID;
        document
          .getElementById(frameID)
          ?.contentWindow.postMessage(this.message, this.host);
      });
    }
  }

  customElements.define("vpde-chart", VPDEChart);
})();
