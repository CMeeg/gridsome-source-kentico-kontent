const slugify = require('@sindresorhus/slugify');

class GridsomeTaxonomyItem {
  constructor(typeName, terms) {
    this.typeName = typeName;
    this.terms = [];

    this.addTerms(this, terms);
  }

  addTerms(node, terms) {
    if (terms.length === 0) {
      return;
    }

    for (const term of terms) {
      const termNode = {
        id: term.codename,
        name: term.name,
        slug: this.getSlug(node, term),
        terms: []
      };

      node.terms.push(termNode);

      // Terms can be nested so we will recursively call this function

      this.addTerms(termNode, term.terms);
    }
  }

  getSlug(node, term) {
    let slug = slugify(term.codename);

    if (node.slug) {
      // The "parent" term node has a slug so we need to include that
      // when forming the slug for this term
      slug = `${node.slug}/${slug}`;
    }

    return slug;
  }
}

module.exports = GridsomeTaxonomyItem;
