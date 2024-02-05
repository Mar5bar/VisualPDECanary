function createWelcomeTour(onMobile) {
  // If Shepherd is not defined, return.
  if (typeof Shepherd === "undefined") {
    return;
  }
  // Create the welcome tour.
  const tour = new Shepherd.Tour({
    useModalOverlay: true,
    defaultStepOptions: {
      classes: "shadow-md bg-purple-dark",
      scrollTo: false,
      cancelIcon: {
        enabled: true,
      },
      buttons: [
        {
          action() {
            return this.back();
          },
          classes: "shepherd-button-secondary",
          text: "Back",
        },
        {
          action() {
            return this.next();
          },
          text: "Next",
        },
      ],
      when: {
        show() {
          addStepCounter();
        },
      },
    },
  });

  let interactiveStr = `Interactivity is at the heart of VisualPDE. In most simulations, clicking on the screen allows you to interact directly with the solution.<br><video autoplay loop playsinline muted disableRemotePlayback poster="../assets/images/demo.webp" width="128" style="margin-top:10px"><source src='../assets/ani/demo.mp4' type='video/mp4'><source src='../assets/ani/demo.webm' type='video/webm'></video><br>This can even kickstart pattern formation or other exciting phenomena.`;
  if (onMobile) {
    interactiveStr = interactiveStr.replaceAll("clicking", "tapping");
    interactiveStr = interactiveStr.replaceAll("click", "tap");
    interactiveStr = interactiveStr.replaceAll("Clicking", "Tapping");
    interactiveStr = interactiveStr.replaceAll("Click", "Tap");
  }
  tour.addStep({
    title: "Playing with PDEs",
    text: interactiveStr,
    buttons: [
      {
        action() {
          return this.next();
        },
        text: "Next",
      },
    ],
  });

  tour.addStep({
    title: "Equations and definitions",
    text: `Customise the equations, parameters, boundary and initial conditions of the simulation.<br><video autoplay loop playsinline muted disableRemotePlayback width="216" style="margin-top:10px"><source src='../assets/ani/params.mp4' type='video/mp4'><source src='../assets/ani/params.webm' type='video/webm'></video>`,
    attachTo: {
      element: "#equations",
      on: "right",
    },
    when: {
      show() {
        addStepCounter();
        addMoreInfoLink("/user-guide/advanced-options.html#equations");
      },
    },
  });

  tour.addStep({
    title: "Play/pause",
    text: `Play or pause the simulation. You can still draw when paused.`,
    attachTo: {
      element: "#play_pause_placeholder",
      on: "right",
    },
  });

  tour.addStep({
    title: "Reset",
    text: `Click to restart the simulation. You can change the initial conditions in the equations menu.`,
    attachTo: {
      element: "#erase",
      on: "right",
    },
    when: {
      show() {
        addStepCounter();
        addMoreInfoLink(
          "/user-guide/advanced-options.html#checkpoints",
          "Advanced",
        );
      },
    },
  });

  tour.addStep({
    title: "Views",
    text: `The Views menu lets you customise your view of the solution. This includes everything from contours to colour bars.<br><div class=views_pics><img src='../assets/images/FHNTuringWave.webp'><img src='../assets/images/midnight_soliton.webp'><img src='../assets/images/complexGinzburgLandau.webp'></div>`,
    attachTo: {
      element: "#views",
      on: "right",
    },
    when: {
      show() {
        addStepCounter();
        addMoreInfoLink("/user-guide/advanced-options.html#views");
      },
    },
  });

  tour.addStep({
    title: "Settings",
    text: `Tweak advanced options such as the equation type, the domain resolution and the timestepping scheme.`,
    attachTo: {
      element: "#settings",
      on: "right",
    },
    when: {
      show() {
        addStepCounter();
        addMoreInfoLink("/user-guide/advanced-options.html#settings");
      },
    },
  });

  tour.addStep({
    title: "Sharing",
    text: `VisualPDE is built for sharing. Copy a link that leads straight to the current simulation, download snapshots of your solution or even embed your simulation in your own site.`,
    attachTo: {
      element: "#share",
      on: "right",
    },
    when: {
      show() {
        addStepCounter();
        addMoreInfoLink("/user-guide/FAQ.html#sharing");
      },
    },
  });

  tour.addStep({
    title: "Help",
    text: `Help is always at hand. Access FAQs, detailed documentation and guides explaining how to do everything that's possible in VisualPDE. You can even restart this tour.`,
    attachTo: {
      element: "#help",
      on: "right",
    },
    buttons: [
      {
        action() {
          return this.back();
        },
        classes: "shepherd-button-secondary",
        text: "Back",
      },
      {
        action() {
          return this.complete();
        },
        text: "Finish",
      },
    ],
  });
  return tour;
}

/**
 * The `addStepCounter()` function is used to add a step counter to the header of the current step in a Shepherd tour.
 *
 * The function first retrieves the active tour and the current step within that tour.
 * It then gets the DOM element associated with the current step and the header within that element.
 * A new span element is created and given the class "shepherd-progress".
 * The inner text of this span element is set to the current step number and the total number of steps in the format "current / total".
 * This span element is then inserted into the header, before the cancel icon.
 *
 * Note: This function uses optional chaining (`?.`), so if any of the properties or methods are undefined or null, it will not throw an error and will instead return undefined.
 */
function addStepCounter() {
  // If Shepherd is not defined, return.
  if (typeof Shepherd === "undefined") {
    return;
  }
  const currentStep = Shepherd.activeTour?.getCurrentStep();
  const currentStepElement = currentStep?.getElement();
  const header = currentStepElement?.querySelector(".shepherd-header");
  const progress = document.createElement("span");
  progress.classList.add("shepherd-progress");
  progress.innerText = `${
    Shepherd.activeTour?.steps.indexOf(currentStep) + 1
  } / ${Shepherd.activeTour?.steps.length}`;
  header?.insertBefore(
    progress,
    currentStepElement.querySelector(".shepherd-cancel-icon"),
  );
}

function addMoreInfoLink(link, label) {
  // If Shepherd is not defined, return.
  if (typeof Shepherd === "undefined") {
    return;
  }
  const currentStep = Shepherd.activeTour?.getCurrentStep();
  const currentStepElement = currentStep?.getElement();
  const footer = currentStepElement?.querySelector(".shepherd-footer");
  const moreInfo = document.createElement("a");
  moreInfo.setAttribute("href", link);
  moreInfo.setAttribute("target", "_blank");
  moreInfo.classList.add("shepherd-more-info");
  moreInfo.innerText = label ? label : `More info.`;
  footer?.insertBefore(moreInfo, footer.firstChild);
}

export { createWelcomeTour };
