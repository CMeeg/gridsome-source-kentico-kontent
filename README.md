# @meeg/gridsome-source-kentico-cloud

A [Kentico Cloud](https://kenticocloud.com/) data source plugin for [Gridsome](https://gridsome.org/) that aims to support all of the main features of Kentico Cloud:

✔ Content (including all content element types)\
✔ Taxonomy\
✔ Assets

The plugin also provides additional features and extension points to ease working with your Kentico Cloud content in Gridsome. Please keep reading to learn about:

* How to [get started](#getting-started) with this plugin
* The object types and object models that are added to the Gridsome [GraphQL schema](#kentico-cloud-graphql-schema) by this plugin
* How to [render Rich Text fields](#rendering-rich-text-fields) using Vue single file components that you define in your app
* How to [customise routing](#routing) of content and taxonomy objects
* How to [work with Taxonomy](#working-with-taxonomy-in-gridsome) in Gridsome
* How to [work with Assets](#working-with-assets-in-gridsome) in Gridsome, and how to transform Asset URLs directly in your GraphQL queries
* How to [create content models](#creating-content-models) to allow you to customise how content from Kentico Cloud is represented as data in Gridsome
* The full list of plugin [configuration options](#configuration)

---

## Getting started

> This getting started guide assumes that you have an existing Gridsome project, and that you want to add Kentico Cloud as a data source using this plugin. If you haven't yet created a Gridsome project, please follow the [Gridsome getting started guide](https://gridsome.org/docs) first and then come back here.

### Install

Use your preferred package manager to add a dependency on `@meeg/gridsome-source-kentico-cloud` to your Gridsome app, for example:

* `yarn add @meeg/gridsome-source-kentico-cloud`
* `npm install @meeg/gridsome-source-kentico-cloud`

### Add and configure the plugin

Add `@meeg/gridsome-source-kentico-cloud` to the plugins array in your `gridsome.config.js` file, and configure the Kentico Cloud delivery client to fetch data from your [project](https://docs.kenticocloud.com/tutorials/set-up-projects/manage-projects/adding-projects) by specifying your project id in the plugin options:

```javascript
plugins: [
  {
    use: '@meeg/gridsome-source-kentico-cloud',
    options: {
      deliveryClientConfig: {
        projectId: process.env.KENTICO_CLOUD_PROJECT_ID
      }
  }
]
```

> The above configuration assumes that you are using environment variables to manage parts of your project configuration that you want to keep private (or that can vary in different environments), but you could specify the project id directly in the plugin options if you want.
>
>  See the Gridsome docs for general advice on [installing plugins](https://gridsome.org/docs/plugins) and [using environment variables](https://gridsome.org/docs/environment-variables).

🙋 This is the minimum configuration required for the plugin to function. Please see the [configuration](#configuration) section for a complete list of all options available.

### Configure Gridsome to resolve Rich Text fields using Vue single file components

Configure Gridsome to use the "[Runtime + Compiler](https://vuejs.org/v2/guide/installation.html#Runtime-Compiler-vs-Runtime-only)" build of Vue because we will need the compiler to enable us to treat the Rich Text field content as a Vue component template.

In your `gridsome.server.js` file:

```javascript
api.configureWebpack(config => {
    config.resolve.alias['vue'] = 'vue/dist/vue.common';
})
```

Add a Vue single file component that will be used to render Rich Text fields. This component is a wrapper around [`v-runtime-template`](https://github.com/alexjoverm/v-runtime-template) and will be extended to resolve other components embedded inside your Rich Text fields e.g. content components, content links and assets.

Create a new `.vue` file under your app components directory e.g. `src/components/RichText.vue`:

```html
<template>
  <v-runtime-template :template="html" />
</template>

<script>
import VRuntimeTemplate from 'v-runtime-template';

export default {
  components: {
    VRuntimeTemplate
  },
  props: {
    html: {
      type: String,
      required: true
    }
  },
  methods: {
    getNode: function(codename, id) {
      const query = this.$static[codename];

      if (typeof(query) === 'undefined') {
        return null;
      }

      const edges = query.edges.filter(
        edge => edge.node.id === id
      );

      if (edges.length === 1) {
        return edges[0].node;
      }

      return null;
    }
  }
};
</script>
```

🙋 To learn how to extend this component to render content components, content links and assets (and how to opt-out of this approach if you don't like it), please see the section on [rendering Rich Text fields](#rendering-rich-text-fields).

### Query and render your content

From this point on you are ready to work with your Kentico Cloud content as data in Gridsome 😎

> If you are new to Gridsome, the following areas of the [docs](https://gridsome.org/docs) should help you get up and running with data:
>
> * [Data](https://gridsome.org/docs/data)
> * [Querying data](https://gridsome.org/docs/querying-data)
> * [Filtering data](https://gridsome.org/docs/filtering-data)
> * [Paginated data](https://gridsome.org/docs/pagination)
> * [Taxonomy pages](https://gridsome.org/docs/taxonomies)
>
> Remember to use the [GraphQL explorer](https://gridsome.org/docs/querying-data#explore--test-queries) to explore your schema, and test queries when in [development mode](https://gridsome.org/docs/how-it-works#gridsome-develop).

🙋 Now we've covered the basics, please keep reading for a more in-depth discussion of the various features of this plugin.

---

## Kentico Cloud GraphQL schema

The following types of data are sourced from Kentico Cloud and made available for querying via the Gridsome GraphQL data store:

* [Content objects](#content-objects)
* [Taxonomy objects](#taxonomy-objects)
* [Asset objects](#asset-objects)

### Content objects

Content is available by querying against object types named using the codename of the [content type](https://docs.kenticocloud.com/tutorials/set-up-projects/define-content-models/creating-and-deleting-content-types) they belong to converted to pascal case. For example:

* Given the codename `article`, the object type will be named `Article`
* Given the codename `landing_page`, the object type will be named `LandingPage`

🙋 See the section on [configuration](#configuration) for options on how to customise naming of content object types.

#### System fields

Every content object type shares a core set of fields that include:

* System fields provided by the Kentico Cloud delivery client
* Fields required by this plugin
* Fields required by Gridsome

As such, every content object has at least the following fields:

| Name | Type | Notes |
| --- | --- | --- |
| `id` | `String` | Kentico Cloud's id is used as the object's id |
| `name` | `String` | The name of the content item in Kentico Cloud |
| `codename` | `String` | The codename of the content item in Kentico Cloud |
| `languageCode` | `String` | The language codename of the content item |
| `type` | `String` | The codename of the content type in Kentico Cloud  that this content item belongs to |
| `typeName` | `String` | The GraphQL object type name |
| `route` | `String` | The [route](#content-routing) defined for this object type - if this object's `isComponent` field is `true`, this will always be `null` |
| `isComponent` | `Boolean` | `true` if this object represents a content component; otherwise `false` - see the section on [content component objects](#content-component-objects) for further details |
| `date` | `Date` | This is equal to the Kentico Cloud `last_modified` date, but is named `date` because that is the convention in Gridsome |
| `slug` | `String` | This is set to the value of the "URL slug" content element if one is defined on the content type that this content belongs to; otherwise `null` |
| `path` | `String` | This is the path generated by Gridsome and is based on the route defined for this object type |

#### Content element fields

As well as system fields, each object type contains fields that represent each of the content elements of the Kentico Cloud content type that the content belongs to.

These fields are named using the codename of the corresponding content element converted to camel case. For example:

* Given the codename `title`, the field will be named `title`
* Given the codename `page_metadata_meta_title`, the field will be named `pageMetadataMetaTitle`

> If there is a collision of field name a positive auto-incremented integer will be added as a suffix to the field name.
>
> For example, a Kentico Cloud content type has a content element with the codename `date` that will collide with the "system" `date` field so it will receive the field name `date1` when added to the corresponding object type in the GraphQL schema.

All types of content element available in Kentico Cloud are supported and are represented in the object type definition as fields:

| Content element | Type | Notes |
| --- | --- | --- |
| Text | `String` | Text elements are represented as string fields |
| Rich text | `String` | Rich text elements contain HTML markup, but are represented as strings - see the section on [rendering Rich Text fields](#rendering-rich-text-fields) for details of how to render Rich Text fields in your Gridsome app |
| Number | `Number` | Number elements are represented as numbers |
| Multiple choice | `Object` | Multiple choice elements are represented as objects containing two properties: `name`, and `codename` |
| Date & time | `Date` | Date & time elements are represented as dates |
| Asset | `Asset[]` | Asset elements contain an array of references to [asset objects](#asset-objects) |
| Linked items | `<Content>[]` | Linked items elements contain an array of references to the content objects they are linked to - the plugin assumes that the objects are all of the same object type |
| Custom element | `String` | Custom elements are represented as strings |
| Taxonomy | `<Taxonomy>[]` | Taxonomy elements contain an array of references to [taxonomy objects](#taxonomy-objects) belonging to the relevant taxonomy object type |
| URL slug | `String` | URL slug elements are represented as strings - they are regarded as a [system field](#system-fields) and will always be assigned to a field called `slug`, if present |

🙋 See the section on [creating content models](#creating-content-models) for details on how you can customise how content elements are translated to content object fields.

#### Content component objects

Content [components](https://docs.kenticocloud.com/tutorials/write-and-collaborate/structure-your-content/structuring-editorial-articles-with-components) used in Rich Text fields are also added to object types in the Gridsome GraphQL schema.

The difference between content component objects and "regular" content objects is that content component objects will never have values in their `route` or `path` fields because they are components of larger pieces of content and therefore not intended to be used in isolation.

The `isComponent` system field can be used to filter content component objects in content queries if required.

#### Item links

> Item links are primarily used when [rendering Rich Text fields](#rendering-rich-text-fields) so feel free to skip this section unless you really want to read it! 🤓

When editing content inside Rich Text elements in Kentico Cloud you can [add links to other content items](https://docs.kenticocloud.com/tutorials/write-and-collaborate/write-content/composing-content-in-the-rich-text-editor#a-adding-links) within your Kentico Cloud project. To resolve these links within your Gridsome app, the `path` of the content item that has been linked to must be used as the URL of the link.

Gridsome generates the `path` value for an object (based on a [defined](#content-routing) `route`) when it is inserted into the GraphQL data store via the [Data Store API](https://gridsome.org/docs/data-store-api#collectionaddnodeoptions).

To get the `path` of an object in the GraphQL data store you must either:

1. Already have a reference to the relevant content object; or
2. Know the `id` and `typeName` of the content item that has been linked to, and form a GraphQL query to fetch an object with the `id` from the object type that corresponds to the `typeName`

If neither of the above are true, the `ItemLink` object type can be queried using only the `id` of the content item that has been linked to to find the `path` of the corresponding content object.

The `ItemLink` object type has these fields:

| Name | Type | Notes |
| --- | --- | --- |
| `id` | String | Kentico Cloud's id and the id of the corresponding content object |
| `typeName` | String | The GraphQL object type name of the corresponding content object  |
| `path` | String | The path of the corresponding content object |

🙋 See the section on [configuration](#configuration) for options on how to customise naming of the `ItemLink` object type.

### Taxonomy objects

Taxonomy terms are available by querying against object types named using the codename of the [taxonomy group](https://docs.kenticocloud.com/tutorials/set-up-projects/define-content-models/organizing-your-content-with-taxonomies) they belong to converted to pascal case, and prefixed with "Taxonomy". For example:

* Given the taxonomy group codename `tag`, the object type will be named `TaxonomyTag`
* Given the taxonomy group codename `article_topics`, the object type will be named `TaxonomyArticleTopics`

🙋 See the section on [configuration](#configuration) for options on how to customise naming of taxonomy object types.

#### Taxonomy term fields

Taxonomy term object types share a core set of fields that include:

* System fields provided by the Kentico Cloud delivery client
* Fields required by this plugin
* Fields required by Gridsome

As such, every taxonomy term object has the following fields:

| Name | Type | Notes |
| --- | --- | --- |
| `id` | `String` | The codename of the taxonomy term in Kentico Cloud is used as the object's id |
| `name` | `String` | The name of the taxonomy term in Kentico Cloud |
| `slug` | `String` | A slug is generated so that it can be used when specifying [routes](#taxonomy-routing) for object types |
| `terms` | `<Taxonomy>[]` | Taxonomy terms can have child terms, which are an array of references to [taxonomy objects](#taxonomy-objects) |
| `path` | `String` | If a [route](#taxonomy-routing) has been specified for this taxonomy object type Gridsome will generate a path for each object belonging to that type; otherwise the path will be `undefined` |

🙋 For some examples of how taxonomy can be used in Gridsome, please see the section on [working with taxonomy](#working-with-taxonomy-in-gridsome).

### Asset objects

[Assets](https://docs.kenticocloud.com/tutorials/write-and-collaborate/manage-assets/viewing-all-your-project-s-assets) are available by querying against an object type named `Asset`.

🙋 See the section on [configuration](#configuration) for options on how to customise naming of the asset object type.

#### Asset fields

Every asset object has the following fields provided by the Kentico Cloud delivery client:

| Name | Type | Notes |
| --- | --- | --- |
| `id` | `String` | The URL of the asset is used as the object's id |
| `type` | `String` | MIME type of the asset  |
| `size` | `Number` | Size of the asset in bytes |
| `description` | `String` | Description of the asset |
| `url` | `String` | Absolute URL of the asset - this field accepts arguments allowing you to [transform image URLs](#working-with-assets-in-gridsome) directly in your GraphQL queries |
| `width` | `Number` | Width of the image in pixels, if the asset is an image |
| `height` | `Number` | Height of the image in pixels, if the asset is an image |

🙋 For some examples of how assets can be used in Gridsome, please see the section on [working with assets](#working-with-assets-in-gridsome).

## Rendering Rich Text fields

A Rich Text field is a string containing HTML markup, and that HTML markup can contain standard HTML elements as well as:

* Anchor links to other content that require resolving the link URL to the actual URL within your application
* Assets such as images that may require some flexibility in rendering (such as the use of lazy loading and/or `srcset` and `sizes`)
* Custom elements that represent [content components](https://docs.kenticocloud.com/tutorials/write-and-collaborate/structure-your-content/structuring-editorial-articles-with-components)

As briefly touched on in the [getting started](#configure-gridsome-to-resolve-rich-text-fields-using-vue-single-file-components) guide, the recommended way to render Rich Text fields when using this plugin is to use a Vue single file component to represent a Rich Text field, which will:

* Compile the HTML markup as a dynamic template using [`v-runtime-template`](https://github.com/alexjoverm/v-runtime-template); and
* Allow you to write other Vue single file components to represent content components, content links and assets

The following sub-sections detail how to implement the above, and assume that you have already created the `RichText` component outlined in the getting started section.

### Rendering content links in Rich Text fields

First add a query to your `RichText` component inside a `<static-query>` block that will fetch all `ItemLink` objects. The alias for `allItemLink` must be `item_link` as shown below:

```graphql
query RichText {
  item_link: allItemLink {
    edges {
      node {
        id,
        path
      }
    }
  }
}
```

> If you already have a `RichText` query you can add the `item_link` alias and fields alongside other aliases.

Next you must create an `ItemLink` Vue single file component that has a `node` prop, and will render the link appropriately. The "shape" of the `node` prop object will match the node defined on the `item_link` query. The component must also have a `slot` via which the link text will be passed. For example:

```html
<template>
  <g-link :to="node.path">
    <slot />
  </g-link>
</template>

<script>
export default {
  props: {
    node: {
      type: Object,
      required: true
    }
  }
};
</script>
```

Finally, you must add the `ItemLink` component to your `RichText` component:

```html
<script>
import VRuntimeTemplate from 'v-runtime-template';
import ItemLink from '~/components/ItemLink.vue';

export default {
  components: {
    VRuntimeTemplate,
    ItemLink
  },
  props: {
    html: {
      ...
    }
  },
  methods: {
    getNode: function(codename, id) {
      ...
    }
  }
};
</script>
```

Now if the Rich Text field HTML passed in the `html` prop of the `RichText` component contains any `item-link` components, those components have a `node` attribute that will call the `getNode` method with a `codename` of `item_link`, and an `id` that matches the content they are linking to. If an object with a matching `id` is found in the collection, it will be passed to the `item-link` component's `node` prop, otherwise `null` will be passed.

🙋 See the section on [configuration](#configuration) for options on how to customise component names.

### Rendering assets in Rich Text fields

First add a query to your `RichText` component inside a `<static-query>` block that will fetch all `Asset` objects. The alias for `allAsset` must be `asset` as shown below:

```graphql
query RichText {
  asset: allAsset {
    edges {
      node {
        id,
        url(width: 1200, format: "webp"),
        placeholderUrl: url(width: 50, format: "webp")
        description
      }
    }
  }
}
```

> If you already have a `RichText` query you can add the `asset` alias and fields alongside other aliases.

Next you must create an `Asset` Vue single file component that has a `node` prop, and will render the asset appropriately. The "shape" of the `node` prop object will match the node defined on the `asset` query. For example:

```html
<template>
  <v-lazy-image
    :src="node.url"
    :src-placeholder="node.placeholderUrl"
    :alt="node.description"
  />
</template>

<script>
import VLazyImage from 'v-lazy-image';

export default {
  components: {
    VLazyImage
  },
  props: {
    node: {
      type: Object,
      required: true
    }
  }
};
</script>

<style scoped>
img {
   width: 100%;
}

.v-lazy-image {
  filter: blur(5px);
  transition: filter 1.6s;
  will-change: filter;
}

.v-lazy-image-loaded {
  filter: blur(0);
}
</style>
```

> Unfortunately Gridsome's [g-image](https://gridsome.org/docs/images) component doesn't appear to work with `v-runtime-template` so the example above is using [v-lazy-image](https://github.com/alexjoverm/v-lazy-image), but you can try whatever you wish in your own component!

Finally, you must add the `Asset` component to your `RichText` component:

```html
<script>
import VRuntimeTemplate from 'v-runtime-template';
import Asset from '~/components/Asset.vue';

export default {
  components: {
    VRuntimeTemplate,
    Asset
  },
  props: {
    html: {
      ...
    }
  },
  methods: {
    getNode: function(codename, id) {
      ...
    }
  }
};
</script>
```

Now if the Rich Text field HTML passed in the `html` prop of the `RichText` component contains any `asset` components, those components have a `node` attribute that will call the `getNode` method with a `codename` of `asset`, and an `id` that matches the asset they represent. If an object with a matching `id` is found in the collection, it will be passed to the `asset` component's `node` prop, otherwise `null` will be passed.

🙋 See the section on [configuration](#configuration) for options on how to customise component names.

### Rendering content components in Rich Text fields

First add a query to your `RichText` component inside a `<static-query>` block that will fetch all `<Content>` objects. The alias for `all<Content>` must match the codename of the Kentico Cloud content type that the `<Content>` belongs to:

> In the following examples, we will create a component to render code snippets, so the `<Content>` object type is `CodeSnippet` and content type codename is `code_snippet`:

```graphql
query RichText {
  code_snippet: allCodeSnippet {
    edges {
      node {
        id,
        code,
        language {
          name
        }
      }
    }
  }
}
```

> If you already have a `RichText` query you can add the `code_snippet` alias and fields alongside other aliases.

Next you must create a `CodeSnippet` Vue single file component that has a `node` prop, and will render the asset appropriately. The "shape" of the `node` prop object will match the node defined on the `code_snippet` query. For example:

```html
<template>
  <pre class="code-snippet">{{ node.code }}</pre>
</template>

<script>
export default {
  props: {
    node: {
      type: Object,
      required: true
    }
  }
};
</script>
```

Finally, you must add the `CodeSnippet` component to your `RichText` component:

```html
<script>
import VRuntimeTemplate from 'v-runtime-template';
import CodeSnippet from '~/components/CodeSnippet.vue';

export default {
  components: {
    VRuntimeTemplate,
    CodeSnippet
  },
  props: {
    html: {
      ...
    }
  },
  methods: {
    getNode: function(codename, id) {
      ...
    }
  }
};
</script>
```

Now if the Rich Text field HTML passed in the `html` prop of the `RichText` component contains any `code-snippet` components, those components have a `node` attribute that will call the `getNode` method with a `codename` of `code_snippet`, and an `id` that matches the code snippet they represent. If an object with a matching `id` is found in the collection, it will be passed to the `code-snippet` component's `node` prop, otherwise `null` will be passed.

🙋 See the section on [configuration](#configuration) for options on how to customise component names.

### Opting-out of this approach

Although the approach to Rich Text outlined above is recommended it may not be for everybody or every application so it is possible to "opt-out" by setting certain option values to `null` in the plugin configuration. The following options are all keys of `contentItemCong.richText`:

| Option key | Behaviour when set to `null` |
| --- | --- |
| `wrapperCssClass` | Prevents any transformation of Rich Text HTML elements to components |
| `itemLinkSelector` | Content links are not transformed to `item-link` components |
| `assetSelector` | Assets are not transformed to `asset` components |
| `componentSelector` | Content components are not transformed to `<content>` components |

For example:

```javascript
plugins: [
  {
    use: '@meeg/gridsome-source-kentico-cloud',
    options: {
      ...
      contentItemConfig: {
        ...
        richText: {
          wrapperCssClass: null
        }
        ...
      }
      ...
    }
  }
}
```

If you opt out of this approach you can use features of the Kentico Cloud delivery client to resolve [content links](https://github.com/Kentico/kentico-cloud-js/blob/master/packages/delivery/DOCS.md#url-slugs-links) and [content components](https://github.com/Kentico/kentico-cloud-js/blob/master/packages/delivery/DOCS.md#resolving-content-items-and-components-in-rich-text-elements), but not assets. These features of the delivery client are exposed by this plugin when [creating content models](#creating-content-models).

🙋 See the section on [configuration](#configuration) for options on how to customise Rich Text transformation.

## Routing

The Kentico Cloud plugin will add routes for all [content types](#content-routing) in your project, and can optionally add routes for [taxonomy groups](#taxonomy-routing).

#### Content routing

The default [route](https://gridsome.org/docs/routing) for all content objects added by this plugin is:

`/{codename}/:slug`

Where:

* `codename` is the [slugified](https://github.com/sindresorhus/slugify) codename of the Kentico Cloud content type that the content belongs to; and
* `slug` is the [system field](#system-fields) named "slug"

It is possible to override the default route for each of your Kentico Cloud content types using the options exposed by this plugin. To do so you must add an item to the `contentItemConfig.routes` object with a key matching the content type codename you wish to specify the route for, and a value matching the desired route that you wish to use for that content type. For example:

```javascript
plugins: [
  {
    use: '@meeg/gridsome-source-kentico-cloud',
    options: {
      ...
      contentItemConfig: {
        ...
        routes: {
          article: '/articles/:slug',
          author: '/about'
        }
        ...
      }
      ...
    }
  }
}
```

> The route that you specify can use any [parameters](https://gridsome.org/docs/routing#route-params) that Gridsome can resolve.

> Routes are not resolved in any particular order so you may wish to avoid setting a route such as `/:slug` as this could take precedence and conflict with other routes such as the route for `author` in the above example.

### Taxonomy routing

There is no routing of Taxonomy objects by default.

To define a route for a Kentico Cloud taxonomy group you must use the options exposed by this plugin. To do so you must add an item to the `taxonomyConfig.routes` object with a key matching the taxonomy group codename you wish to specify the route for, and a value matching the desired route that you wish to use for that taxonomy group. For example:

```javascript
plugins: [
  {
    use: '@meeg/gridsome-source-kentico-cloud',
    options: {
      ...
      taxonomyConfig: {
        ...
        routes: {
          tags: '/tags/:slug'
        }
        ...
      }
      ...
    }
  }
}
```

> The route that you specify can use any [parameters](https://gridsome.org/docs/routing#route-params) that Gridsome can resolve.

The `slug` field is added to each taxonomy term object by this plugin and is generated like so:

* The `codename` of the taxonomy term is [slugified](https://github.com/sindresorhus/slugify)
* If the term belongs to a "parent" term, the parent's slug is prepended to the current term's slug in the format `{parent-slug}/{slug}`

## Working with Taxonomy in Gridsome

The Gridsome documentation describes how to [create a taxonomy page](https://gridsome.org/docs/taxonomies) template to display a `Tag` object and the `Post` objects that reference that `Tag`.

To achieve this with the Kentico Cloud plugin you will need to ensure that you first set up [routing](#taxonomy-routing) for the taxonomy group that you want to list (i.e. your equivalent of `Tag`), and then you can follow along with the documented approach.

> The plugin will take care of adding the required references between [Taxonomy objects](#taxonomy-objects) (i.e. your equivalent of `Tag`) and [Content objects](#content-objects) (i.e. your equivalent of `Post`) via any [Taxonomy content elements](#content-element-fields) defined on the the Content object's content type in Kentico Cloud.

### Other Taxonomy scenarios

Below are a couple of examples of other things you can do with Taxonomy in Gridsome.

To do the inverse of what is documented and create a template to display a `Post` object and the `Tag` objects that the `Post` references (for example to list tags for a post), you can use a query like the below:

```graphql
query Post ($id: String!) {
  post (id: $id) {
    title,
    tags {
      name,
      path
    }
  }
}
```

If you wanted to list all `Tag` objects including a count of how many `Post` objects reference each tag (for example in a "tag cloud" component), you can use a query like the below:

```graphql
query Tags {
  tags: allTag {
    edges {
      node {
        name,
        path,
        belongsTo {
          totalCount
        }
      }
    }
  }
}
```

## Working with Assets in Gridsome

Assets are represented by the `Asset` object type in the Gridsome GraphQL schema and working with assets is largely the same as working with any other object type. The only "special" thing about `Asset` objects is that the `url` field accepts arguments that allow you to specify [image transformations](#https://github.com/Kentico/kentico-cloud-js/blob/master/packages/delivery/DOCS.md#image-transformations) via a custom [field resolver](https://gridsome.org/docs/data-store-api#collectionaddschemafieldfieldname-fn) that uses the `ImageUrlBuilder` class provided by the Kentico Cloud delivery client.

The arguments accepted are (omit any of the arguments if you do not wish to use it):

| Name | Type | Equivalent `ImageUrlBuilder` function name | Notes |
| --- | --- | --- | --- |
| `width` | `Int` | `withWidth` | Specify the desired width in pixels |
| `height` | `Int` | `withHeight` | Specify the desired height in pixels |
| `automaticFormat` | `Boolean` | `withAutomaticFormat` | `true` if you wish to automatically use `webp` format, and fallback to the asset's source format |
| `format` | `String` | `withFormat` | Accepts any of these values: `gif`, `jpg`, `jpeg`, `pjpg`, `pjpeg`, `png`, `png8`, `webp` |
| `lossless` | `Boolean` | `withCompression` | If `true` use lossless compression; if `false` use lossy compression |
| `quality` | `Int` | `withQuality` | Specify a value in the range of 0 to 100 |
| `dpr` | `Int` | `withDpr` | Specify a value in the range of 1 to 5 |

> There are currently no arguments that are equivalent to the following functions of the `ImageUrlBuilder`:
> * `withCustomParam`
> * `withRectangleCrop`
> * `withFocalPointCrop`
> * `withFitMode`

You can use it in a GraphQL query like the below:

```graphql
query Assets {
  assets: allAsset {
    edges {
      node {
        id,
        name,
        url(width: 1200, format: "webp"),
        placeholderUrl: url(width: 50, format: "webp"), # You can use aliases and supply different arguments to fetch multiple transformed URLs per query
        type,
        size,
        description,
        width,
        height
      }
    }
  }
}
```

## Creating content models

The default behaviour of this plugin when translating content from Kentico Cloud to objects in the [Gridsome GraphQL data store](#content-objects) should hopefully be sufficient in the majority of cases - a goal of the plugin is to allow consumers to get up and running with as little configuration as possible. However, the plugin does provide an extension point should you find yourself in a position where you want to modify the default behaviour.

> Extending the translation of `Taxonomy` and `Asset` objects is not currently supported as those types are essentially comprised only of "system" fields and cannot be extended in Kentico Cloud; compared to content types that also have "system" fields, but are designed to be extended in Kentico Cloud by adding content elements.

The majority of the work required to translate content from Kentico Cloud to the Gridsome GraphQL data store is performed via a custom `ContentItem` [model](https://github.com/Kentico/kentico-cloud-js/blob/master/packages/delivery/DOCS.md#creating-models) that is automatically passed to the delivery client as a [type resolver](https://github.com/Kentico/kentico-cloud-js/blob/master/packages/delivery/DOCS.md#initializing-deliveryclient).

The default behaviour is to use the same content model for all Kentico Cloud content types. This content model is represented by the `GridsomeContentItem` class, which is a sub-class of `ContentItem`.

To modify the default behaviour you can create a new class that extends `GridsomeContentItem` and register it as the type resolver for one or more Kentico Cloud content types.

### Extending `GridsomeContentItem`

For demonstration purposes we will use an example where we want to manipulate content data as it is inserted into Gridsome's data store so that we don't have to keep applying some logic on the data each and every time we use it within our application.

This is our scenario:

* There is a Kentico Cloud content type called `Post` that has a codename of `post`
* The content type has a content element called `Date` with a codename of `date` that can be used to manually specify the date that the post was posted, with the intention being to fall back to the system last modified date if no `Date` value is specified
* When this plugin runs it creates an object type in the Gridsome GraphQL schema named `Post`, but the field that represents the `Date` content element is called `date1` because it [collides](#content-element-fields) with the system `date` field

The goal is to:

* Set the system `date` field to the value of the `Date` content element, but only if a value has been set; otherwise leave the `date` field value as it is
* Remove the `date1` field as it is redundant once the `date` field value has been resolved as above

To do this we must first create a custom content model somewhere in our application that extends `GridsomeContentItem` and implements the desired behaviour:

```javascript
const { GridsomeContentItem } = require('@meeg/gridsome-source-kentico-cloud');

class PostContentItem extends GridsomeContentItem {
  // Override the `addFields` function - this is called after all "system" fields are set
  addFields(node) {
    /*
    Call the `addFields` function of the base class - we want the default behaviour to run
    first, and then we will manipulate the data to enforce our custom behaviour
    */
    super.addFields(node);

    this.ensureDateField(node);

    return node;
  }

  ensureDateField(node) {
    /*
    `node.item` contains the data that will eventually end up as an object in the
    Gridsome GraphQL data store
    */
    const postDate = new Date(node.item.date1);
    const lastModified = new Date(node.item.date);

    // If a date has been provided, use it instead of the system date

    if (!this.isNullDate(postDate)) {
      node.item.date = postDate;
    }

    // Add the system date as a custom field i.e. one that does not correspond to a content element

    node.item.lastModified = lastModified;

    // Remove the redundant `date1` field

    node.item.date1 = undefined;
  }

  isNullDate(date) {
    if (typeof(date) === 'undefined') {
      return true;
    }

    if (date === null) {
      return true;
    }

    // If a date value is null in Kentico Cloud it can be parsed as a zero UTC date

    return date.getTime() === 0;
  }
}

module.exports = PostContentItem;
```

Now we have implemented our desired behaviour we need to [register the class model as a type resolver](#registering-type-resolvers).

### Registering type resolvers

Type resolvers can be registered via the options exposed by this plugin. To do so you must add an item to the `contentItemConfig.contentItems` object with a key matching the content type codename you wish to specify the type resolver for, and a value that references the content model class that you wish as the type resolver for that content type. For example:

```javascript
const PostContentItem = require('./the/path/to/PostContentItem');

module.exports = {
  ...
  plugins: [
    {
      use: '@meeg/gridsome-source-kentico-cloud',
      options: {
        ...
        contentItemConfig: {
          ...
          contentItems: {
            post: PostContentItem
          }
          ...
        }
        ...
      }
    }
  }
  ...
}
```

### Other scenarios

There could be any number of scenarios in which you may wish to extend `GridsomeContentItem`, but here are a few more examples of ways in which you can extend content models.

#### Overriding field resolvers

The `addFields` function seen [earlier](#extending-gridsomecontentitem) effectively loops through each content element defined on the field type and:

* Attempts to find and execute an instance function named `${fieldName}FieldResolver` where `fieldName` is the codename of the content element converted to camel case; and if none is found
* Attempts to find and execute an instance function named `${fieldType}TypeFieldResolver` where `fieldType` is the type of the content element converted to camel case; and if none is found
* Executes an instance function named `defaultFieldResolver`

The function that is executed receives a `node` and `field` as arguments:

* `node` represents the data that will eventually be inserted into the Gridsome GraphQL data store
* `field` represents the content element data that has come from Kentico Cloud

The responsibility of the function is to set a value on the `node` that will contain the data from the `field` transformed into whatever format is deemed suitable for the Gridsome GraphQL data store.

Field resolvers can be used like this:

```javascript
const { GridsomeContentItem } = require('@meeg/gridsome-source-kentico-cloud');

class PostContentItem extends GridsomeContentItem {
  // This function will be used when resolving the "author" content element of this type
  authorFieldResolver(node, field) {
    const fieldName = field.fieldName;
    const value = field.value;

    // This is a pretty contrived example, but hopefully illustrates the point!
    if (!value) {
      value = 'Joe Bloggs';
    }

    this.addField(node, fieldName, value);
  }

  // This function will be used when resolving all "Multiple choice" content elements of this type
  multipleChoiceTypeFieldResolver(node, field) {
    const fieldName = field.fieldName;

    // By default this value would be an object containing `name` and `codename` properties, but we just want `name`
    const value = field.value.name;

    this.addField(node, fieldName, value);
  }
}

module.exports = PostContentItem;
```

#### Set a field value based on linked content items

We saw earlier that you can [extend how field data is set](#extending-gridsomecontentitem) within a content model by overriding the `addFields` function. The `addFields` function receives a `node` object that represents the data from a single content item from Kentico Cloud transformed into a data structure that will be used to populate the Gridsome GraphQL data store.

In the previous example we used the `item` property of the `node` to get and set field values, but the `node` object has other properties that can be used when manipulating field data.

For example, in this scenario:

* We have a `Post series` content type in Kentico Cloud with a codename of `post_series`
* The `Post series` content type has a "Linked items" content element called `Posts in series` with codename `posts_in_series`
* `Posts in series` has a constraint requiring at least one linked item be set

The goal is to:

* Add a `lastUpdated` field to the corresponding `PostSeries` object type in the Gridsome GraphQL schema (there is no corresponding content element on the Kentico Cloud content type)
* Set the value of the `lastUpdated` field by getting the linked posts in its `postsInSeries` field, and using the most recent `date` value of the linked `Post` objects

```javascript
const { GridsomeContentItem } = require('@meeg/gridsome-source-kentico-cloud');

class PostSeriesContentItem extends GridsomeContentItem {
  addFields(node) {
    super.addFields(node);

    this.setLastUpdatedField(node);

    return node;
  }

  setLastUpdatedField(node) {
    // Find the `postsInSeries` field and then run it through a map function to return the most recent post date
    const postLastUpdated = node.linkedItemFields
      .filter(field => field.fieldName === 'postsInSeries')
      .map(field => this.getPostLastUpdated(field.linkedItems));

    // Add the most recent post date as a new field called `lastUpdated`
    const value = postLastUpdated[0];

    // Calling the `addField` function will make sure there are no field name collisions
    this.addField(node, 'lastUpdated', value);
  }

  getPostLastUpdated(posts) {
    const postDates = posts
      .map(post => {
        const node = post.createNode();
        const date = node.item.date;

        return date;
      })
      .reduce((prevDate, currentDate) => {
        return prevDate > currentDate ? prevDate : currentDate
      });

    return postDates;
  }
}

module.exports = PostSeriesContentItem;
```

> When you are inside an instance function such as `addFields` you also have access to all of the properties of a regular `ContentItem` such as `this.system` and `this.elements` should you need them.

#### Custom Rich Text and Link resolvers

`GridsomeContentItem` uses custom [richTextResolver](https://github.com/Kentico/kentico-cloud-js/blob/master/packages/delivery/DOCS.md#globally) and [linkResolver](https://github.com/Kentico/kentico-cloud-js/blob/master/packages/delivery/DOCS.md#resolving-url-slugs-globally) functions to aid in the approach for [rendering Rich Text fields](#rendering-rich-text-fields), but if you decide to [opt out](#opting-out-of-this-approach) of that approach you may want to provide your own resolver functions.

You can do so like this:

```javascript

const { GridsomeContentItem } = require('@meeg/gridsome-source-kentico-cloud');

class PostContentItem extends GridsomeContentItem {
  // We need to override the constructor of `GridsomeContentItem`
  constructor(typeName, route, richTextHtmlTransformer) {
    /*
    Set our resolvers - N.B this `data` object mimics the object that you can pass to the `ContentItem` constructor
    */
    const data = {
        richTextResolver: (item, context) => {
          return `<h3 class="resolved-item">${item.name.text}</h3>`;
        },
        linkResolver: (link, context) => {
          return `/posts/${url_slug}`;
        }
    };

    // Execute the super constructor, passing in your resolver functions
    super(typeName, route, richTextHtmlTransformer, data);
  }
}

module.exports = PostContentItem;
```

## Logging and debugging

The plugin uses the [debug](https://github.com/visionmedia/debug) library for logging. It can be used for debugging or just gathering logs about what the plugin is doing.

The plugin defines the following namespaces:

| Namespace | Description |
| --- | --- |
| `gridsome-source-kentico-cloud` | Use this to log very basic info about when the plugin starts and finishes its work |
| `gridsome-source-kentico-cloud:source` | Use this to log detailed information about the work that the plugin is doing |

Please read the debug docs for usage instructions.

## Configuration

The plugin exposes various configuration options that are split into the following top level objects:

```javascript
plugins: [
  {
    use: '@meeg/gridsome-source-kentico-cloud',
    options: {
      deliveryClientConfig: {
        // Options for the Kentico Cloud delivery client
      },
      contentItemConfig: {
        // Options used when loading Kentico Cloud content data
      },
      taxonomyConfig: {
        // Options used when loading Kentico Cloud taxonomy data
      }
  }
]
```

> The only required option that must be set for this plugin to function is `deliveryClientConfig.projectId` as seen in the [getting started](#add-and-configure-the-plugin) section. All other options are set with default values that can be overridden by the consuming application.

### `deliveryClientConfig` options

These options are identical to the Kentico Cloud delivery client configuration options, with one exception:

| Key | Type | Default value | Notes |
| --- | --- | --- | --- |
| `contentItemsDepth` | `Number` | `3` | Sets the `depth` parameter on content queries, which can be used to [handle missing referenced linked items](https://github.com/Kentico/kentico-cloud-js/blob/delivery%405.7.2/packages/delivery/DOCS.md#handling-missing-referenced-linked-items) |

Please see the [Kentico Cloud documentation](https://github.com/Kentico/kentico-cloud-js/blob/delivery%405.7.2/packages/delivery/DOCS.md#client-configuration) for a description of all other available options, which include options for setting preview mode, secure mode, and language.

### `contentItemConfig` options

| Key | Type | Default value | Notes |
| --- | --- | --- | --- |
| `contentItemTypeNamePrefix` | `String` | `''` | If set, this value will be added as a prefix to generated [content object type](#content-objects) names |
| `assetTypeName` | `String` | `'Asset'` | If set, this value will be used as the [asset object type](#asset-objects) name |
| `itemLinkTypeName` | `String` | `'ItemLink'` | If set, this value will be used as the [item link object type](#item-links) name |
| `contentItems` | `Object` | `{}` | Please see the [creating content models](#creating-content-models) section |
| `routes` | `Object` | `{}` | Please see the [content routing](#content-routing) section |
| `richText` | `Object` |  | Please see the [richText options](#richtext-options) section |

#### `richText` options

| Key | Type | Default value | Notes |
| --- | --- | --- | --- |
| `wrapperCssClass` | `String` | `'rich-text'` | When used as a Vue [template](#rendering-rich-text-fields), Rich Text HTML must have a single root node and so the plugin wraps the HTML in a div with a class attribute set to this value; can be set to `null` to [opt out](#opting-out-of-this-approach) of the default approach to rendering Rich Text fields |
| `componentNamePrefix` | `String` | `''` | If set, this value will be added as a prefix to the component name used to [render content components](#rendering-content-components-in-rich-text-fields) in Rich Text fields |
| `componentSelector` | `String` | `'p[data-type="item"]'` | This CSS selector is used to find elements that represent content components in Rich Text HTML; can be set to `null` to [opt out](#opting-out-of-this-approach) of the default approach to rendering content components in Rich Text fields |
| `itemLinkComponentName` | `String` | `'item-link'` | This value will be used as the component name used to [render content links](#rendering-content-links-in-rich-text-fields) in Rich Text fields |
| `itemLinkSelector` | `String` | `'a[data-item-id]'` | This CSS selector is used to find elements that represent content links in Rich Text HTML; can be set to `null` to [opt out](#opting-out-of-this-approach) of the default approach to rendering content links in Rich Text fields |
| `assetComponentName` | `String` | `'asset'` | This value will be used as the component name used to [render assets](#rendering-assets-in-rich-text-fields) in Rich Text fields |
| `assetSelector` | `String` | `'figure[data-asset-id]'` | This CSS selector is used to find elements that represent assets in Rich Text HTML; can be set to `null` to [opt out](#opting-out-of-this-approach) of the default approach to rendering assets in Rich Text fields |

### `taxonomyConfig` options

| Key | Type | Default value | Notes |
| --- | --- | --- | --- |
| `taxonomyTypeNamePrefix` | `String` | `'Taxonomy'` | If set, this value will be added as a prefix to generated [taxonomy object type](#taxonomy-objects) names |
| `routes` | `Object` | `{}` | Please see the [taxonomy routing](#taxonomy-routing) section |
