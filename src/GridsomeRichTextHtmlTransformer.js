const changeCase = require('change-case');
const cheerio = require('cheerio');

class GridsomeRichTextHtmlTransformer {
  constructor(options) {
    this.options = options;
  }

  canTransformRichText() {
    return this.options.wrapperCssClass !== null;
  }

  canTransformLinks() {
    return this.canTransformRichText()
      && this.options.itemLinkSelector !== null
      && this.options.itemLinkComponentName !== null;
  }

  canTransformComponents() {
    return this.canTransformRichText()
      && this.options.componentSelector !== null;
  }

  canTransformAssets() {
    return this.canTransformRichText()
      && this.options.assetSelector !== null
      && this.options.assetComponentName !== null;
  }

  transformRichTextHtml(field) {
    let html = field.resolveHtml();

    if (!this.canTransformRichText()) {
      return html;
    }

    const wrapperCssClass = this.options.wrapperCssClass;

    html = `<div class="${wrapperCssClass}">${html}</div>`;

    const $ = cheerio.load(html, { decodeEntities: false });

    // Kentico Kontent can return an empty paragraph element if there is no content, which is of no use
    // If the rich text element has no text content, just return an empty string

    if ($(`.${wrapperCssClass}`).text().trim() === '') {
      return '';
    }

    // Transform item links
    // N.B. This shouldn't be necessary, but the `urlSlugResolver` feature of the Kentico Kontent SDK doesn't appear to work all of the time
    // TODO: If this does work consistently in future, this can be removed

    this.transformItemLinks($);

    // Unwrap components

    this.transformComponents($);

    // Transform assets

    this.transformAssets($);

    // Return the parsed html

    html = cheerio.html($(`.${wrapperCssClass}`), { decodeEntities: false });

    return html;
  }

  transformComponents($) {
    if (!this.canTransformComponents()) {
      return;
    }

    const componentSelector = this.options.componentSelector;
    const components = $(componentSelector);

    components.each((index, element) => {
      const component = $(element);

      const componentHtml = component.html();

      component.replaceWith(componentHtml);
    });
  }

  getComponentName(codename) {
    const componentNamePrefix = this.options.componentNamePrefix.length;
    const componentCodename = componentNamePrefix.length > 0
      ? `${componentNamePrefix}-${codename}`
      : codename;

    return changeCase.kebabCase(componentCodename);
  }

  getComponentHtml(id, type) {
    // Rich text components will be rendered as Vue components

    const componentName = this.getComponentName(type);

    const html = `<${componentName} :node="getNode('${type}', '${id}')" />`;

    return html;
  }

  transformItemLinks($) {
    if (!this.canTransformLinks()) {
      return;
    }

    const itemLinkSelector = this.options.itemLinkSelector;
    const itemLinks = $(itemLinkSelector);

    itemLinks.each((index, element) => {
      const itemLink = $(element);
      const itemId = itemLink.data('itemId');
      const linkText = itemLink.html();

      const itemLinkHtml = this.getLinkHtml(itemId, linkText);

      itemLink.replaceWith(itemLinkHtml);
    });
  }

  getLinkHtml(id, text) {
    // Links to content items in rich text elements will be rendered as Vue components

    const componentName = this.getComponentName(this.options.itemLinkComponentName);

    const html = `<${componentName} :node="getNode('item_link', '${id}')">${text}</item-link>`;

    return html;
  }

  transformAssets($) {
    if (!this.canTransformAssets()) {
      return;
    }

    const assetSelector = this.options.assetSelector;
    const assets = $(assetSelector);

    assets.each((index, element) => {
      const asset = $(element);
      const assetImg = asset.find('img');

      if (assetImg.length === 0) {
        // TODO: What to do with other types of assets? Currently the
        // id of an asset node is the url, but where do we get that from?

        return;
      }

      const assetId = assetImg.attr('src');

      // TODO: The asset id is available in the `data-asset-id` attribute, but
      // the url is currently used as the Gridsome node id because the id is not
      // available in asset data retrieved via the delivery API - the below will
      // need to change if/when the id is made available

      const assetHtml = this.getAssetHtml(assetId);

      asset.replaceWith(assetHtml);
    });
  }

  getAssetHtml(id) {
    // Assets will be rendered as Vue components

    const componentName = this.getComponentName(this.options.assetComponentName);

    const html = `<${componentName} :node="getNode('asset', '${id}')" />`;

    return html;
  }
}

module.exports = GridsomeRichTextHtmlTransformer;
