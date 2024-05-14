// Define a function that takes in a list of HTML ids and, whenever the user scrolls,
// checks which one is closest to the middle of the viewport. All sims get paused, apart from
// the one closest to the middle of the page.
function run_only_one_sim(ids) {
  window.addEventListener("scroll", function () {
    const middleOfViewport = [window.innerHeight / 2, window.innerWidth / 2];
    let closestId = null;
    let closestDistance = Infinity;

    ids.forEach(function (id) {
      const element = document.getElementById(id);
      if (element) {
        const rect = element.getBoundingClientRect();
        const distance =
          Math.abs(rect.top + rect.height / 2 - middleOfViewport[0]) +
          Math.abs(rect.left + rect.width / 2 - middleOfViewport[1]);
        console.log(id, distance);
        if (distance < closestDistance) {
          closestId = id;
          closestDistance = distance;
        }
      }
    });

    if (closestId) {
      // Pause all the other sims.
      ids.forEach(function (id) {
        if (id == closestId) {
          return;
        }
        console.log("Pausing " + id);
        document.getElementById(id)?.contentWindow.postMessage(
          {
            type: "pauseSim",
          },
          "/",
        );
      });

      // Play the closest sim.
      console.log("Playing " + closestId);
      document.getElementById(closestId)?.contentWindow.postMessage(
        {
          type: "playSim",
        },
        "/",
      );
    }
  });
}
