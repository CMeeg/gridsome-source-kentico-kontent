const DeliveryClient = require('./GridsomeDeliveryClient');
const KenticoCloudSource = require('./KenticoCloudSource');
const GridsomeContentItemFactory = require('./GridsomeContentItemFactory');
const GridsomeContentItem = require('./GridsomeContentItem');
const GridsomeTaxonomyItemFactory = require('./GridsomeTaxonomyItemFactory');
const Logger = require('./Logger');

class KenticoCloudSourcePlugin {
  static defaultOptions() {
    return {
      deliveryClientConfig: {
        projectId: '',
        contentItemsDepth: 3
      },
      contentItemConfig: {
        contentItemTypeNamePrefix: '',
        contentItems: {},
        routes: {},
        richText: {
          wrapperCssClass: 'rich-text',
          componentNamePrefix: '',
          itemLinkSelector: 'a[data-item-id]',
          itemLinkComponentName: 'item-link',
          componentSelector: 'p[data-type="item"]',
          assetSelector: 'figure[data-asset-id]',
          assetComponentName: 'asset'
        },
        assetTypeName: 'Asset',
        itemLinkTypeName: 'ItemLink'
      },
      taxonomyConfig: {
        taxonomyTypeNamePrefix: 'Taxonomy',
        routes: {}
      },
      loggerConfig: {
        enable: 'gridsome-source-kentico-cloud'
      }
    }
  };

  constructor(api, options) {
    const logger = new Logger('gridsome-source-kentico-cloud', options.loggerConfig);

    api.loadSource(async store => {
      const deliveryClient = new DeliveryClient(options.deliveryClientConfig);
      const contentItemFactory = new GridsomeContentItemFactory(options.contentItemConfig);
      const taxonomyItemFactory = new GridsomeTaxonomyItemFactory(options.taxonomyConfig);

      const kenticoCloudSource = new KenticoCloudSource(
        deliveryClient,
        contentItemFactory,
        taxonomyItemFactory,
        logger
      );

      logger.log('Started loading content from Kentico Cloud');

      await kenticoCloudSource.load(store);

      logger.log('Finished loading content from Kentico Cloud');
    });
  }
}

module.exports = KenticoCloudSourcePlugin;
module.exports.GridsomeContentItem = GridsomeContentItem;
