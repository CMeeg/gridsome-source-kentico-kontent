# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

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
