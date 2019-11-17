# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## 0.4.0 (2019-11-17)

### ⚠ BREAKING CHANGES

* This is only a breaking change if you have derived from `GridsomeContentItem` and overridden the `addFields` function.
    * `addFields` is now async so that other async functions, tools, libs can be used when creating content items.

### Features

* Content item node creation is now an async operation ([c606fb5](https://github.com/CMeeg/gridsome-source-kentico-kontent/commit/c606fb5))

## 0.3.0 (2019-10-21)

### ⚠ BREAKING CHANGES

* **gridsome:** Gridsome 0.7 changes the way routing is handled. Routing is no longer taken care of by this plugin and you will need to update your app to use the new [templates config](https://gridsome.org/blog/2019/09/17/gridsome-v07/#new-template-configuration) instead. Other changes to Gridsome may effect your app also, so please read through the 0.7 announcement blog post and this project's readme and adjust accordingly.

### Features

* **gridsome:** Update to use latest version of Gridsome ([a73002b](https://github.com/CMeeg/gridsome-source-kentico-kontent/commit/a73002b)), closes [#6](https://github.com/CMeeg/gridsome-source-kentico-kontent/issues/6)

## 0.2.0 (2019-09-30)

### ⚠ BREAKING CHANGES

* Due to [changes](https://github.com/Kentico/kentico-kontent-js/blob/master/packages/delivery/UPGRADE.md) in the Kentico Kontent Delivery API, there are some breaking changes within `GridsomeContentItem` and `deliveryClientConfig`.

These may not apply to your project so please run `gridsome develop` first and then come back here if you are seeing errors:

* `GridsomeContentItem`: Access to raw `ContentItem` fields is now via `this._raw.elements` rather than `this.elements`
* `GridsomeContentItem`: 'linkResolver` has been renamed to `urlSlugResolver`
* `deliveryClientConfig`: A few of the available options have changed - please review the [Kentico Kontent documentation](https://github.com/Kentico/kentico-kontent-js/blob/master/packages/delivery/DOCS.md#client-configuration) for supported configuration options

This update also replaces references to "Kentico Cloud" with "Kentico Kontent" due to the recent rebrand, which has resulted in a rename of this plugin.

### Features

* Update to use latest Kentico Kontent JavaScript SDK ([2b5ac62](https://github.com/CMeeg/gridsome-source-kentico-kontent/commit/2b5ac62)), closes [#7](https://github.com/CMeeg/gridsome-source-kentico-kontent/issues/7), [#8](https://github.com/CMeeg/gridsome-source-kentico-kontent/issues/8), [#9](https://github.com/CMeeg/gridsome-source-kentico-kontent/issues/9)

## 0.1.2 (2019-09-30)


## 0.1.1 (2019-09-15)

### Bug Fixes

* Prevent duplicate asset nodes ([9452267](https://github.com/CMeeg/gridsome-source-kentico-kontent/commit/9452267)), closes [#3](https://github.com/CMeeg/gridsome-source-kentico-kontent/issues/3)
* Prevent error being thrown when content with no URL slug field ([e857f11](https://github.com/CMeeg/gridsome-source-kentico-kontent/commit/e857f11)), closes [#4](https://github.com/CMeeg/gridsome-source-kentico-kontent/issues/4)
