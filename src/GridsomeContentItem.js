const { ContentItem } = require('@kentico/kontent-delivery');
const changeCase = require('change-case');
const { merge } = require('lodash');
const slugify = require('@sindresorhus/slugify');

class GridsomeContentItem extends ContentItem {
  constructor(typeName, richTextHtmlTransformer, data) {
    const defaultData = {
      propertyResolver: (elementName) => {
        return this.resolveProperty(elementName);
      }
    };

    if (richTextHtmlTransformer.canTransformComponents()) {
      defaultData.richTextResolver = (item, context) => {
        return this.resolveRichText(item, context);
      };
    }

    if (richTextHtmlTransformer.canTransformLinks()) {
      defaultData.urlSlugResolver = (link, context) => {
        // TODO: This doesn't always appear to get called - raise issue with Kentico Kontent when have repro steps
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
    this.richTextHtmlTransformer = richTextHtmlTransformer;
  }

  resolveProperty(elementName) {
    return this.getFieldName(elementName);
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
      html: this.richTextHtmlTransformer.getLinkHtml(id, text)
    }
  }

  async createNode() {
    const node = this.initNode();

    await this.addFields(node);

    return node;
  }

  initNode() {
    // Get system data

    const { id, name, codename, language: languageCode, type, lastModified } = this.system;

    // If the content item's id and name are the same, this is a Rich Text Component

    const isComponent = id === name;
    const defaultSlug = isComponent ? null : slugify(name);

    // Initialise a content node with fields from system data, which should be consistent across all nodes in Gridsome

    const node = {
      item: {
        id,
        name,
        codename,
        languageCode,
        type,
        typeName: this.typeName,
        isComponent: isComponent,
        date: new Date(lastModified),
        slug: defaultSlug // Will be overwritten if a `URL slug` type element is present on the content type
      },
      assetFields: [],
      linkedItemFields: [],
      taxonomyFields: [],
      richTextFields: []
    };

    return node;
  }

  async addFields(node) {
    // Add Content Elements as fields to the node

    for (const codename in this._raw.elements) {
      const element = this._raw.elements[codename];
      const fieldName = this.getFieldName(codename);
      const field = this[fieldName];

      if (element.type === 'asset') {
        field.value = field.value.map(asset => {
          // We will use the asset url as the id as it is unique, and the id is not provided
          // TODO: Raise issue with Kentico Kontent to ask if asset ids can be provided

          asset.id = asset.url;

          return asset;
        });
      }

      // Get a Field Resolver and use it to add the field and its value to the node
      // TODO: Custom elements

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

    const richTextField = {
      fieldName,
      assets: field.images
    };

    node.richTextFields.push(richTextField);

    this.addField(node, fieldName, html);
  }

  modularContentTypeFieldResolver(node, field) {
    const fieldName = field.fieldName;
    const linkedItems = field.value;
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
    const value = field.value.map(term => term.codename);
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
    const assets = field.value;
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

    while (Object.prototype.hasOwnProperty.call(node.item, fieldName)) {
      fieldNameCount++;

      fieldName = `${name}${fieldNameCount}`;
    }

    return fieldName;
  }
}

module.exports = GridsomeContentItem;
