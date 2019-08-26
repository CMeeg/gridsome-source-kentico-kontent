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

  getRoute(codename) {
    const route = this.options.routes[codename];

    if (typeof(route) === 'undefined') {
      return null;
    }

    return route;
  }

  createTaxonomyItem(taxonomyGroup) {
    const codename = taxonomyGroup.system.codename;
    const typeName = this.getTypeName(codename);
    const route = this.getRoute(codename);
    const terms = taxonomyGroup.terms;

    return new GridsomeTaxonomyItem(typeName, route, terms);
  }
}

module.exports = GridsomeTaxonomyItemFactory;
