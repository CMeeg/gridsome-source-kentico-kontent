# @meeg/gridsome-source-kentico-cloud

A [Kentico Cloud](https://kenticocloud.com/) data source plugin for  [Gridsome](https://gridsome.org/) that aims to support all of the main features of Kentico Cloud:

✔ Content (including all content element types)\
✔ Taxonomy\
✔ Assets

The following features and extension points are also provided to ease working with your Kentico Cloud content in Gridsome:

✔ Customise how content from Kentico Cloud is represented in the Gridsome GraphQL schema e.g. control how object types are named, how fields are resolved, omit unwanted fields, add custom fields\
✔ Customise routing of content and taxonomy pages\
✔ Write your own Vue components to render content components, content links, and assets embedded in Rich Text fields\
✔ Transform asset URLs directly from your GraphQL queries e.g. specify width, height, format via arguments

---

## Getting started

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

🙋 Please keep reading for a more in-depth discussion of the features of this plugin, including descriptions of:

* The object types and object models added to the [GraphQL schema](#kentico-cloud-graphql-schema) by this plugin
* How to [render Rich Text fields](#rendering-rich-text-fields) using Vue single file components that you define in your app
* How to [customise routing](#routing) of content and taxonomy objects
* How to work with [Taxonomy](#working-with-taxonomy-in-gridsome) in Gridsome
* How to work with [Assets](#working-with-assets-in-gridsome) in Gridsome and transform Asset URLs directly in your GraphQL queries
* How to [create content models](#creating-content-models) to allow you to customise how content from Kentico Cloud is represented in the GraphQL schema
* The full list of plugin [configuration options](#configuration)

---

## Kentico Cloud GraphQL schema

The following types of data are sourced from Kentico Cloud and made available for querying via the Gridsome GraphQL schema:

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

Gridsome generates the `path` value for an object (based on a [defined](#content-routing) `route`) when it is inserted into the GraphQL schema via the [Data Store API](https://gridsome.org/docs/data-store-api#collectionaddnodeoptions).

To get the `path` of an object in the GraphQL schema you must either:

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

TODO

The recommended way to render child components, links and assets embedded in Rich Text fields when using this plugin is to write your own Vue components that you define in your Gridsome app. It is recommended because it is idiomatic of a Vue component to render components in this way, and preferred to embedding HTML markup into [delivery client](https://github.com/Kentico/kentico-cloud-js/blob/master/packages/delivery/DOCS.md#resolving-content-items-and-components-in-rich-text-elements) requests or `[ContentItem](https://github.com/Kentico/kentico-cloud-js/blob/master/packages/delivery/DOCS.md#url-slugs-links)` classes.

### Opting-out of this approach

TODO

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

To achieve this with the Kentico Cloud plugin you will need to ensure that you set up [routing](#taxonomy-routing) for the taxonomy group that you want to list (i.e. your equivalent of `Tag`).

> The plugin will take care of adding the required references between [Taxonomy objects](#taxonomy-objects) and [Content objects](#content-objects) (i.e. your equivalent of `Post`) via any [Taxonomy content elements](#content-element-fields) defined on the the Content object's content type in Kentico Cloud.

To do the inverse of what is documented and create a template to display a `Post` object and the `Tag` objects that the `Post` references, you can use a query like the below:

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

And if you wanted to list all `Tag` objects including a count of how many `Post` objects reference each tag, you can use a query like the below:

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

| Name | Type | Equivalent `ImageUrlBuilder` method name | Notes |
| --- | --- | --- | --- |
| `width` | `Int` | `withWidth` | Specify the desired width in pixels |
| `height` | `Int` | `withHeight` | Specify the desired height in pixels |
| `automaticFormat` | `Boolean` | `withAutomaticFormat` | `true` if you wish to automatically use `webp` format, and fallback to the asset's source format |
| `format` | `String` | `withFormat` | Accepts any of these values: `gif`, `jpg`, `jpeg`, `pjpg`, `pjpeg`, `png`, `png8`, `webp` |
| `lossless` | `Boolean` | `withCompression` | If `true` use lossless compression; if `false` use lossy compression |
| `quality` | `Int` | `withQuality` | Specify a value in the range of 0 to 100 |
| `dpr` | `Int` | `withDpr` | Specify a value in the range of 1 to 5 |

> There are currently no arguments that are equivalent to the following methods of the `ImageUrlBuilder`:
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

TODO

The majority of the work required to translate content elements to GraphQL fields is performed via custom `ContentItem` [models](https://github.com/Kentico/kentico-cloud-js/blob/master/packages/delivery/DOCS.md#creating-models) that are automatically passed to the delivery client as [type resolvers](https://github.com/Kentico/kentico-cloud-js/blob/master/packages/delivery/DOCS.md#initializing-deliveryclient).

## Configuration

TODO




---

TODO: Remove all of the below notes when done!

- Getting started
- Options
    - Delivery client
        - [Preview](https://github.com/Kentico/kentico-cloud-js/blob/master/packages/delivery/DOCS.md#preview-mode)
        - [Secure API](https://github.com/Kentico/kentico-cloud-js/blob/master/packages/delivery/DOCS.md#secured-delivery-api-mode)
        - [Language](https://github.com/Kentico/kentico-cloud-js/blob/master/packages/delivery/DOCS.md#getting-localized-items)
        - [Type resolvers](https://github.com/Kentico/kentico-cloud-js/blob/master/packages/delivery/DOCS.md#initializing-deliveryclient)
    - Recommend use of env files
- GridsomeContentItem
    - File system convention
    - [Models](https://github.com/Kentico/kentico-cloud-js/blob/master/packages/delivery/DOCS.md#creating-models)
    - [Type resolvers](https://github.com/Kentico/kentico-cloud-js/blob/master/packages/delivery/DOCS.md#initializing-deliveryclient)
    - [Property resolver](https://github.com/Kentico/kentico-cloud-js/blob/master/packages/delivery/DOCS.md#property-binding-in-models)
    - Nodes
        - Fields
            - Common fields
        - Taxonomy
        - [Linked items](https://github.com/Kentico/kentico-cloud-js/blob/master/packages/delivery/DOCS.md#strongly-typed-nested-items)
            - If possible, avoid content elements with same codename but different types e.g. text and rich text
        - Assets
    - Routes
        - Don't use [link resolver](https://github.com/Kentico/kentico-cloud-js/blob/master/packages/delivery/DOCS.md#url-slugs-links)
        - Links in Rich Text fields
    - Extensibility
        - Field resolvers
            - Field name
            - Type
            - Default
    - Using [Kentico Cloud Model Generator](https://www.npmjs.com/package/kentico-cloud-model-generator-utility)
- Rich text
    - Rich Text as dynamic Vue template
        - v-runtime-template
            - Configuration
            - eslint error about unused components
        - Content item links
            - Item link
        - [Content items and components](https://github.com/Kentico/kentico-cloud-js/blob/master/packages/delivery/DOCS.md#resolving-content-items-and-components-in-rich-text-fields)
            - Vue components
            - Removal of wrapper element
    - Prefer "Image" content type over inline assets to give more control
        - Link to KC docs mentioning this
