const debug = require('debug');

class Logger {
  constructor(namespace, options) {
    this.namespace = namespace;
    this.options = options;

    this.logger = debug(namespace);

    if (options.enable) {
      debug.enable(options.enable);
    }
  }

  log(message, ...args) {
    this.logger(message, ...args);
  }

  extend(namespace) {
    const contextNamespace = `${this.namespace}:${namespace}`;

    return new Logger(contextNamespace, this.options);
  }
}

module.exports = Logger;
