const debug = require('debug');

class Logger {
  constructor(namespace) {
    this.namespace = namespace;

    this.logger = debug(namespace);
  }

  log(message, ...args) {
    this.logger(message, ...args);
  }

  extend(namespace) {
    const contextNamespace = `${this.namespace}:${namespace}`;

    return new Logger(contextNamespace);
  }
}

module.exports = Logger;
