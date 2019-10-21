const changeCase = require('change-case');
const GridsomeContentItem = require('./GridsomeContentItem');
const GridsomeRichTextHtmlTransformer = require('./GridsomeRichTextHtmlTransformer');

class GridsomeContentItemFactory {
  constructor(options) {
    this.options = options;

    this.contentItems = null;
  }

  getTypeName(codename) {
    const typeNamePrefix = this.options.contentItemTypeNamePrefix;
    const typeName = `${typeNamePrefix}${changeCase.pascalCase(codename)}`;

    return typeName;
  }

  getContentItem(codename) {
    const ContentItem = this.options.contentItems[codename];

    if (typeof(ContentItem) === 'undefined') {
      return GridsomeContentItem;
    }

    return ContentItem;
  }

  getRichTextHtmlTransformer() {
    return new GridsomeRichTextHtmlTransformer(this.options.richText);
  }

  createContentItem(contentType) {
    const codename = contentType.system.codename;
    const typeName = this.getTypeName(codename);
    const ContentItem = this.getContentItem(codename);
    const richTextHtmlTransformer = this.getRichTextHtmlTransformer();
    const data = {};

    return new ContentItem(typeName, richTextHtmlTransformer, data);
  }

  getAssetTypeName() {
    return this.options.assetTypeName;
  }

  getItemLinkTypeName() {
    return this.options.itemLinkTypeName;
  }
}

module.exports = GridsomeContentItemFactory;
