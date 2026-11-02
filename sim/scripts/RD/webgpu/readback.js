// readback.js
//
// Keeps to one asynchronous readback of a kind at a time.

/**
 * Makes one readback at a time: while one is under way, a request for another is noted, and
 * left to the first to make once its values have arrived (as they may be out of date).
 */
export class Readback {
  pending = false;
  again = false;

  /**
   * Starts read() unless a readback is under way. Once its values arrive, calls
   * use(values, again), again being whether another readback was requested meanwhile.
   * @param {() => Promise<any>} read
   * @param {(values: any, again: boolean) => void} use
   */
  request(read, use) {
    if (this.pending) {
      this.again = true;
      return;
    }
    this.pending = true;
    read().then(
      (values) => {
        this.pending = false;
        const again = this.again;
        this.again = false;
        use(values, again);
      },
      // E.g. if the device was lost.
      () => (this.pending = false),
    );
  }
}
