class AsyncMutex {
  constructor() {
    this._locked = false;
    this._waiting = [];
  }
  lock() {
    return new Promise((resolve) => {
      if (!this._locked) {
        this._locked = true;
        resolve();
      } else {
        this._waiting.push(resolve);
      }
    });
  }
  unlock() {
    if (this._waiting.length > 0) {
      const next = this._waiting.shift();
      next();
    } else {
      this._locked = false;
    }
  }
}
module.exports = { AsyncMutex };
