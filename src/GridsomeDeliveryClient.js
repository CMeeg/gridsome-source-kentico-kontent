const { TypeResolver, DeliveryClient } = require('@kentico/kontent-delivery');
const version = require('./version');

class GridsomeDeliveryClient {
  constructor(deliveryClientConfig, logger) {
    this.deliveryClientConfig = deliveryClientConfig;
    this.logger = logger.extend('delivery-client');

    this.deliveryClient = null;
  }

  getDeliveryClient() {
    if (this.deliveryClient !== null) {
      return this.deliveryClient;
    }

    this.addSourceHeader(this.deliveryClientConfig);

    this.deliveryClient = new DeliveryClient(this.deliveryClientConfig);

    return this.deliveryClient;
  }

  addSourceHeader(deliveryClientConfig) {
    if (version === '0.0.0') {
      // version has not been generated - assume running in dev so don't add the header

      return;
    }

    const sourceHeader = {
      header: 'X-KC-SOURCE',
      value: `gridsome-source-kentico-kontent;${version}`
    };

    deliveryClientConfig.globalQueryConfig = deliveryClientConfig.globalQueryConfig || {};

    let headers = deliveryClientConfig.globalQueryConfig.customHeaders;

    if (!headers) {
      // There are no custom headers set so just add the source header and return

      deliveryClientConfig.globalQueryConfig.customHeaders = [sourceHeader];

      return;
    }

    // Check if the source header is already present, and remove it if so

    if (headers.some(header => header.header === sourceHeader.header)) {
      this.logger.log(`The provided "${sourceHeader.header}" header will be replaced by the source plugin.`);

      headers = headers.filter(header => header.header !== sourceHeader.header);
    }

    // Add the source header

    headers.push(sourceHeader);

    deliveryClientConfig.globalQueryConfig.customHeaders = headers;
  }

  addTypeResolver(codename, createContentItemFunc) {
    if (typeof(this.deliveryClientConfig.typeResolvers) === 'undefined') {
      this.deliveryClientConfig.typeResolvers = [];
    }

    this.deliveryClientConfig.typeResolvers.push(
      new TypeResolver(
        codename,
        createContentItemFunc
      )
    );

    // We can't add a type resolver after the delivery client has been created so
    // we clear it out so it can be recreated by `getDeliveryClient`

    this.deliveryClient = null;
  }

  async getContentTypes() {
    const deliveryClient = this.getDeliveryClient();

    const contentTypes = await deliveryClient
      .types()
      .toPromise();

    return contentTypes;
  }

  async getContent(codename) {
    const deliveryClient = this.getDeliveryClient();
    const depth = this.deliveryClientConfig.contentItemsDepth;

    const contentItems = await deliveryClient
      .items()
      .type(codename)
      .depthParameter(depth)
      .toPromise();

    return contentItems;
  }

  async getTaxonomyGroups() {
    const deliveryClient = this.getDeliveryClient();

    const taxonomyGroups = await deliveryClient
      .taxonomies()
      .toPromise();

    return taxonomyGroups;
  }
}

module.exports = GridsomeDeliveryClient;
