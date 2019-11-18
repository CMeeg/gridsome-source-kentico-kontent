const GridsomeAssetItem = require('./GridsomeAssetItem');

class GridsomeAssetItemFactory {
  constructor(options) {
    this.options = options;
  }

  getTypeName() {
    return this.options.assetTypeName;
  }

  createAssetItem(asset) {
    const typeName = this.getTypeName();

    return new GridsomeAssetItem(typeName, asset);
  }
}

module.exports = GridsomeAssetItemFactory;
