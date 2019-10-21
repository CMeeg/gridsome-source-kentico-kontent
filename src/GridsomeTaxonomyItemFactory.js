const changeCase = require('change-case');
const GridsomeTaxonomyItem = require('./GridsomeTaxonomyItem');

class GridsomeTaxonomyItemFactory {
  constructor(options) {
    this.options = options;
  }

  getTypeName(codename) {
    const typeNamePrefix = this.options.taxonomyTypeNamePrefix;
    const typeName = `${typeNamePrefix}${changeCase.pascalCase(codename)}`;

    return typeName;
  }

  createTaxonomyItem(taxonomyGroup) {
    const codename = taxonomyGroup.system.codename;
    const typeName = this.getTypeName(codename);
    const terms = taxonomyGroup.terms;

    return new GridsomeTaxonomyItem(typeName, terms);
  }
}

module.exports = GridsomeTaxonomyItemFactory;
