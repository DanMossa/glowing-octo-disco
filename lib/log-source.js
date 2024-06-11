"use strict";

const _ = require("lodash");
const Faker = require("Faker");
const P = require("bluebird");

/*
    We don't like OOP - in fact - we despise it!

    However, most real world implementations of something like a log source
    will be in OO form - therefore - we simulate that interaction here.
*/

module.exports = class LogSource {
  /**
   * @property {boolean} drained
   * @property {LogEntry} last
   */
  constructor() {
    this.drained = false;
    this.last = {
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * _.random(40, 60)),
      msg: Faker.Company.catchPhrase(),
    };
  }

  /**
   * @private
   * @returns {LogEntry}
   */
  getNextPseudoRandomEntry() {
    return {
      date: new Date(
        this.last.date.getTime() +
          1000 * 60 * 60 * _.random(10) +
          _.random(1000 * 60)
      ),
      msg: Faker.Company.catchPhrase(),
    };
  }

  /**
   * @returns {boolean|{LogEntry}}
   */
  pop() {
    this.last = this.getNextPseudoRandomEntry();
    if (this.last.date > new Date()) {
      this.drained = true;
    }
    return this.drained ? false : this.last;
  }

  /**
   * @returns {Promise<boolean|{LogEntry}>}
   */
  popAsync() {
    this.last = this.getNextPseudoRandomEntry();
    if (this.last.date > Date.now()) {
      this.drained = true;
    }
    return P.delay(_.random(8)).then(() => (this.drained ? false : this.last));
  }
};
