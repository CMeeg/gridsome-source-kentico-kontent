const { ImageUrlBuilder, ImageCompressionEnum, ImageFormatEnum } = require('@kentico/kontent-delivery');

class KenticoKontentSource {
  constructor(deliveryClient, contentItemFactory, taxonomyItemFactory, logger) {
    this.deliveryClient = deliveryClient;
    this.contentItemFactory = contentItemFactory;
    this.taxonomyItemFactory = taxonomyItemFactory;
    this.logger = logger.extend('source');
  }

  async load(store) {
    // Content types are used to configure type resolvers on the deliveryClient

    const contentTypes = await this.deliveryClient.getContentTypes();

    this.addTypeResolvers(contentTypes);

    // Add Taxonomy nodes first because the content item nodes may require references to Taxonomy terms in Taxonomy fields

    await this.addTaxonomyGroupNodes(store);

    // Add Content item nodes

    for (const contentType of contentTypes.types) {
      await this.addContentNodes(store, contentType);
    }

    // Add custom GraphQL schema fields

    this.addSchemaFields(store);
  }

  addTypeResolvers(contentTypes) {
    // Each content type holds a reference to a ContentItem type that will be used as a type resolver

    for (const contentType of contentTypes.types) {
      const codename = contentType.system.codename;

      this.logger.log('Adding type resolver for content type %s', codename);

      this.deliveryClient.addTypeResolver(
        codename,
        () => this.contentItemFactory.createContentItem(contentType)
      );
    }
  }

  getCollection(store, typeName, route = null) {
    const collection = store.getContentType(typeName);

    if (typeof (collection) !== 'undefined') {
      return collection;
    }

    const type = {
      typeName, route
    };

    this.logger.log('Creating Gridsome content type %o', type);

    return store.addContentType(type);
  }

  async addTaxonomyGroupNodes(store) {
    // Fetch taxonomy groups from the delivery client

    const taxonomyGroups = await this.deliveryClient.getTaxonomyGroups();

    for (const taxonomyGroup of taxonomyGroups.taxonomies) {
      // Add the taxonomy group to the store

      const taxonomyItem = this.taxonomyItemFactory.createTaxonomyItem(taxonomyGroup);
      const typeName = taxonomyItem.typeName;
      const route = taxonomyItem.route;

      const collection = this.getCollection(store, typeName, route);

      // Add taxonomy terms from this group to the collection
      // The reference is added because terms can be nested so the term nodes hold references to other terms

      collection.addReference('terms', typeName);

      this.addTaxonomyTermNodes(collection, taxonomyItem.terms);
    }
  }

  addTaxonomyTermNodes(collection, terms) {
    if (terms.length === 0) {
      return;
    }

    for (const term of terms) {
      const termNode = {
        id: term.id,
        name: term.name,
        slug: term.slug,
        terms: term.terms.map(childTerm => childTerm.id)
      };

      this.logger.log('Adding Gridsome node for taxonomy term %o', term);

      collection.addNode(termNode);

      // Terms can be nested so we will recursively call this function

      this.addTaxonomyTermNodes(collection, term.terms);
    }
  }

  async addContentNodes(store, contentType) {
    // Fetch content items from the delivery client

    const codename = contentType.system.codename;

    const content = await this.deliveryClient.getContent(codename);
    const { items: contentItems } = content;
    const linkedItems = Object.keys(content.linkedItems).map(key => content.linkedItems[key]);

    if (contentItems.length === 0) {
      // There are no content items to process so we go no further

      this.logger.log('No content items found for content type %s', codename);

      return;
    }

    if (linkedItems.length > 0) {
      // Add the linked item nodes first because the content item nodes may have
      // references to linked items in Linked Item fields

      // This will also add Rich Text Components as content nodes, which
      // aren't available when fetching content items from the delivery client

      this.logger.log('Adding linked items for content of type %s', codename);

      this.addContentItemNodes(store, linkedItems);
    }

    // Now add the content items

    this.logger.log('Adding content items for content of type %s', codename);

    this.addContentItemNodes(store, contentItems);
  }

  addContentItemNodes(store, contentItems) {
    for (const contentItem of contentItems) {
      // Create the content item node

      const node = contentItem.createNode();

      this.logger.log('Creating Gridsome node for content %O', node);

      // Get the appropriate collection to add the node to

      const typeName = node.item.typeName;
      const route = node.item.route;

      const collection = this.getCollection(store, typeName, route);

      // Add the node to the collection

      this.addContentNode(store, collection, node);
    }
  }

  addContentNode(store, collection, node) {
    const existingNode = collection.getNode(node.item.id);

    if (existingNode !== null) {
      return existingNode;
    }

    this.addLinkedItemFields(collection, node);

    this.addTaxonomyFields(collection, node);

    this.addAssetFields(store, collection, node);

    const collectionNode = collection.addNode(node.item);

    if (!collectionNode.isComponent) {
      // Also use the content item node to create an ItemLink node that will
      // be used to resolve links to content items inside rich text fields

      this.addItemLinkNode(store, collectionNode);
    }

    return collectionNode;
  }

  addLinkedItemFields(collection, node) {
    // Add a reference to the linked items collection for all linked item fields defined on the node

    for (const linkedItemField of node.linkedItemFields) {
      if (linkedItemField.linkedItems.length === 0) {
        // There are no linked items so no need to do anything

        continue;
      }

      // We need a type name to add a reference

      const typeNames = linkedItemField.linkedItems.map(linkedItem => linkedItem.typeName);

      if (typeNames.length > 1) {
        // TODO: Throw or log an error/warning that linked items must be
        // of the same type as Gridsome does not allow references to multiple
        // types on the same field
      }

      const fieldName = linkedItemField.fieldName;
      const typeName = typeNames[0];

      collection.addReference(fieldName, typeName);
    }
  }

  addTaxonomyFields(collection, node) {
    // Add a reference to the relevant taxonomy group collection for all taxonomy fields defined on the node

    for (const taxonomyField of node.taxonomyFields) {
      const fieldName = taxonomyField.fieldName;
      const codename = taxonomyField.taxonomyGroup;

      const typeName = this.taxonomyItemFactory.getTypeName(codename);

      collection.addReference(fieldName, typeName);
    }
  }

  addAssetFields(store, collection, node) {
    // Get or create the Asset collection

    const typeName = this.contentItemFactory.getAssetTypeName();

    const assetCollection = this.getCollection(store, typeName);

    // Add a reference to the Asset collection for all asset fields defined on the node

    for (const assetField of node.assetFields) {
      const fieldName = assetField.fieldName;
      const assets = assetField.assets;

      for (const asset of assets) {
        const id = asset.id;

        // Only add the asset node if it does not already exist in the collection

        const existingNode = assetCollection.getNode(id);

        if (existingNode === null) {
          this.logger.log('Creating Gridsome node for asset %o', asset);

          assetCollection.addNode(asset);
        }
      }

      collection.addReference(fieldName, typeName);
    }
  }

  addItemLinkNode(store, node) {
    // Get or create the Item Link collection

    const typeName = this.contentItemFactory.getItemLinkTypeName();

    const collection = this.getCollection(store, typeName);

    // Add the Item Link node to the collection
    // The path is generated by Gridsome based on the route defined by the content type

    const itemLinkNode = {
      id: node.id,
      typeName: node.typeName,
      path: node.path
    };

    this.logger.log('Creating Gridsome node for item link %o', itemLinkNode);

    collection.addNode(itemLinkNode);
  }

  addSchemaFields(store) {
    this.addAssetSchemaFields(store);
  }

  addAssetSchemaFields(store) {
    // TODO: This doesn't feel like the right place to do this

    const typeName = this.contentItemFactory.getAssetTypeName();

    const collection = this.getCollection(store, typeName);

    collection.addSchemaField('url', ({ graphql }) => ({
      type: graphql.GraphQLString,
      args: {
        width: {
          type: graphql.GraphQLInt,
          defaultValue: null
        },
        height: {
          type: graphql.GraphQLInt,
          defaultValue: null
        },
        automaticFormat: {
          type: graphql.GraphQLBoolean,
          defaultValue: null
        },
        format: {
          type: graphql.GraphQLString,
          defaultValue: null
        },
        lossless: {
          type: graphql.GraphQLBoolean,
          defaultValue: null
        },
        quality: {
          type: graphql.GraphQLInt,
          defaultValue: null
        },
        dpr: {
          type: graphql.GraphQLInt,
          defaultValue: null
        }
      },
      resolve (node, args) {
        const url = node.url;
        const type = node.type;

        let urlBuilder = new ImageUrlBuilder(url);

        if (args.width !== null) {
          urlBuilder = urlBuilder.withWidth(args.width);
        }

        if (args.height !== null) {
          urlBuilder = urlBuilder.withHeight(args.height);
        }

        if (args.automaticFormat !== null) {
          if (args.automaticFormat) {
            switch (type.toLowerCase()) {
              case 'image/gif':
                urlBuilder = urlBuilder.withAutomaticFormat(ImageFormatEnum.Gif)
                break;
              case 'image/jpeg':
                urlBuilder = urlBuilder.withAutomaticFormat(ImageFormatEnum.Jpg)
                break;
              case 'image/png':
                urlBuilder = urlBuilder.withAutomaticFormat(ImageFormatEnum.Png)
                break;
            }
          }
        }

        if (args.format !== null) {
          switch (args.format.toLowerCase()) {
            case 'gif':
              urlBuilder = urlBuilder.withFormat(ImageFormatEnum.Gif)
              break;
            case 'jpg':
            case 'jpeg':
              urlBuilder = urlBuilder.withFormat(ImageFormatEnum.Jpg)
              break;
            case 'pjpg':
            case 'pjpeg':
              urlBuilder = urlBuilder.withFormat(ImageFormatEnum.Pjpg)
              break;
            case 'png':
              urlBuilder = urlBuilder.withFormat(ImageFormatEnum.Png)
              break;
            case 'png8':
              urlBuilder = urlBuilder.withFormat(ImageFormatEnum.Png8)
              break;
            case 'webp':
              urlBuilder = urlBuilder.withFormat(ImageFormatEnum.Webp)
              break;
          }
        }

        if (args.lossless !== null) {
          const compression = args.lossless ? ImageCompressionEnum.Lossless : ImageCompressionEnum.Lossy;

          urlBuilder = urlBuilder.withCompression(compression);
        }

        if (args.quality !== null) {
          urlBuilder = urlBuilder.withQuality(args.quality);
        }

        if (args.dpr !== null) {
          urlBuilder = urlBuilder.withDpr(args.dpr);
        }

        return urlBuilder.getUrl();
      }
    }));
  }
}

module.exports = KenticoKontentSource;
