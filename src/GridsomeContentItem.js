const { ContentItem } = require('kentico-cloud-delivery');
const changeCase = require('change-case');
const { merge } = require('lodash');

class GridsomeContentItem extends ContentItem {
  constructor(typeName, route, richTextHtmlTransformer, data) {
    const defaultData = {
      propertyResolver: (fieldName) => {
        return this.resolveProperty(fieldName);
      }
    };

    if (richTextHtmlTransformer.canTransformComponents()) {
      defaultData.richTextResolver = (item, context) => {
        return this.resolveRichText(item, context);
      };
    }

    if (richTextHtmlTransformer.canTransformLinks()) {
      defaultData.linkResolver = (link, context) => {
        // TODO: Ask Kentico Cloud why this seems to be being ignored
        // Removing this results in warnings from the DeliveryClient when advanced logging is turned on
        return this.resolveLink(link, context);
      };
    }

    // Allows for overriding of defaults and setting of other `data` options via constructor

    const mergedData = merge(
      {},
      defaultData,
      data
    );

    super(mergedData);

    this.typeName = typeName;
    this.route = route;
    this.richTextHtmlTransformer = richTextHtmlTransformer;
  }

  resolveProperty(fieldName) {
    return this.getFieldName(fieldName);
  }

  getFieldName(fieldName) {
    const nodeFieldName = changeCase.camelCase(fieldName);

    return nodeFieldName;
  }

  resolveRichText(item, context) {
    const id = item.system.id;
    const type = item.system.type;

    return this.richTextHtmlTransformer.getComponentHtml(id, type);
  }

  resolveLink(link, context) {
    const id = link.linkId;
    const text = context.linkText;

    return {
      asHtml: this.richTextHtmlTransformer.getLinkHtml(id, text)
    }
  }

  createNode() {
    const node = this.initNode();

    this.addFields(node);

    return node;
  }

  initNode() {
    // Get system data

    const { id, name, codename, language: languageCode, type, lastModified } = this.system;

    // If the content item's id and name are the same, this is a Rich Text Component

    const isComponent = id === name;

    // Initialise a content node with fields from system data, which should be consistent across all nodes in Gridsome

    const node = {
      item: {
        id,
        name,
        codename,
        languageCode,
        type,
        typeName: this.typeName,
        route: isComponent ? null : this.route, // Components are not independent content and so will not have a route
        isComponent: isComponent,
        date: new Date(lastModified),
        slug: null // Will be overwritten if a `URL slug` type field is present on the content type
      },
      assetFields: [],
      linkedItemFields: [],
      taxonomyFields: []
    };

    return node;
  }

  addFields(node) {
    // Add Content Elements as fields to the node

    for (const codename in this.elements) {
      const element = this.elements[codename];
      const fieldName = this.getFieldName(codename);
      let field = this[fieldName];

      if (element.type === 'modular_content') {
        // "Linked items" fields are different to all others for some reason so we force it to be more uniform
        // TODO : Ask Kentico Cloud to make it consistent

        field = {
          name: element.name,
          type: element.type,
          value: element.value,
          linkedItems: field
        };
      }

      if (element.type === 'asset') {
        // The AssetModel doesn't have width and height, but the element value does so we will map those values across
        // TODO: Ask Kentico Cloud to add width and height

        field.assets = field.assets.map(asset => {
          const url = asset.url;

          element.value
            .filter(elementAsset => elementAsset.url === url)
            .map(elementAsset => {
              asset.width = elementAsset.width;
              asset.height = elementAsset.height;
            });

          // We will use the asset url as the id as it is unique, and the id is not provided
          // TODO: Ask Kentico Cloud if it can be provided

          asset.id = url;

          return asset;
        });
      }

      // Get a Field Resolver and use it to add the field and its value to the node
      // TODO: Custom element fields

      field.fieldName = fieldName;

      const fieldResolver = this.getFieldResolver(field);

      fieldResolver.apply(this, [node, field]);
    }
  }

  getFieldResolver(field) {
    // Try to get a field resolver based on the field name

    let fieldResolver = this.getFieldNameFieldResolver(field);

    if (fieldResolver === null) {
      // Fall back to getting a field resolver based on the field type

      fieldResolver = this.getFieldTypeFieldResolver(field);
    }

    if (fieldResolver === null) {
      fieldResolver = this.defaultFieldResolver;
    }

    return fieldResolver;
  }

  getFieldNameFieldResolver(field) {
    const fieldName = field.fieldName;

    const fieldResolver = this[fieldName + 'FieldResolver'];

    if (typeof (fieldResolver) === 'undefined') {
      return null;
    }

    return fieldResolver;
  }

  getFieldTypeFieldResolver(field) {
    const typeName = changeCase.camelCase(field.type);

    const fieldResolver = this[typeName + 'TypeFieldResolver'];

    if (typeof (fieldResolver) === 'undefined') {
      return null;
    }

    return fieldResolver;
  }

  numberTypeFieldResolver(node, field) {
    const fieldName = field.fieldName;
    const value = Number(field.value);

    this.addField(node, fieldName, value);
  }

  dateTimeTypeFieldResolver(node, field) {
    const fieldName = field.fieldName;
    const value = new Date(field.value);

    this.addField(node, fieldName, value);
  }

  richTextTypeFieldResolver(node, field) {
    const fieldName = field.fieldName;
    const html = this.richTextHtmlTransformer.transformRichTextHtml(field);

    this.addField(node, fieldName, html);
  }

  modularContentTypeFieldResolver(node, field) {
    const fieldName = field.fieldName;
    const linkedItems = field.linkedItems;
    const value = linkedItems.map(linkedItem => linkedItem.system.id);

    const linkedItemField = {
      fieldName,
      linkedItems
    };

    node.linkedItemFields.push(linkedItemField);

    this.addField(node, fieldName, value);
  }

  taxonomyTypeFieldResolver(node, field) {
    const fieldName = field.fieldName;
    const value = field.taxonomyTerms.map(term => term.codename);
    const taxonomyGroup = field.taxonomyGroup;

    const taxonomyField = {
      fieldName,
      taxonomyGroup
    };

    node.taxonomyFields.push(taxonomyField);

    this.addField(node, fieldName, value);
  }

  assetTypeFieldResolver(node, field) {
    const fieldName = field.fieldName;
    const assets = field.assets;
    const value = assets.map(asset => asset.id);

    const assetField = {
      fieldName,
      assets
    };

    node.assetFields.push(assetField);

    this.addField(node, fieldName, value);
  }

  urlSlugTypeFieldResolver(node, field) {
    const value = field.value;

    node.item.slug = value;
  }

  defaultFieldResolver(node, field) {
    const fieldName = field.fieldName;
    const value = field.value;

    this.addField(node, fieldName, value);
  }

  addField(node, name, value) {
    const fieldName = this.getUniqueFieldName(node, name);

    node.item[fieldName] = value;
  }

  getUniqueFieldName(node, name) {
    let fieldName = name;
    let fieldNameCount = 0;

    while (node.item.hasOwnProperty(fieldName)) {
      fieldNameCount++;

      fieldName = `${name}${fieldNameCount}`;
    }

    return fieldName;
  }
}

module.exports = GridsomeContentItem;
