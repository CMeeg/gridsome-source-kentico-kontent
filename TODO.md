* Merge PR
* Update deps (`yarn upgrade-interactive --latest`)
  * Kontent => 7.1.0
  * eslint => 6.5.1
    * Deps?
* Update Gridsome
  * Update package
    * https://github.com/gridsome/gridsome/blob/master/gridsome/CHANGELOG.md
  * Update blog and sample
    * https://gridsome.org/docs/how-to-upgrade/
* Docs
  * Sean Wright suggestion
  * Note about custom elements




* Why not just add a reference to the corresponding content object on an ItemLink?
* If the above works, can we do the same with LinkedContent because then we can support a mix of content types in linked item fields?
    * And we can get rid of ItemLink and just ued LinkedContent?
* Add a "RichText" mixin and add the `getNode` function to it from the RichText component
* Do a bit of research on how custom elements will be represented by the delivery client and how they might be resolved in Gridsome
* Create a sample app
* Provide hooks to replace impl or extend classes
* Documentation
    * Logging docs issue
    * Contributing.md
    * PR template - target develop


npm run develop > log.txt 2>&1

* feature branches need to be squashed and merged
* TODO Generate version number using conventional commit [script](https://github.com/devdigital/git-flow-standard-version#starting-a-release)
* Create release branch
* `yarn run release`
* Review and commit changes `chore(release): Generate changelog and bump version`
* Finish release

* Finish `kontent` work
    * Test with the sample project
* Prep for retirement of `gridsome-source-kentico-cloud`
    * Add a note in docs about compatibility with Gridsome 0.7.x coming soon as possible
    * Remove `gridsome-plugin` from `package.json` tags
    * Add `pr: none` to azure pipelines yaml
    * Push patch release
* Merge `kontent` branch into develop as `feat: Update to use latest Kentico Kontent JavaScript SDK`
    * BREAKING CHANGE: Due to [changes](https://github.com/Kentico/kentico-kontent-js/blob/master/packages/delivery/UPGRADE.md) in the Kentico Kontent Delivery API, there are some breaking changes within `GridsomeContentItem` and `deliveryClientConfig`.
    * These may not apply to your project so please run `gridsome develop` first and then come back here if you are seeing errors:
        * `GridsomeContentItem`: Access to raw `ContentItem` fields is now via `this._raw.elements` rather than `this.elements`
        * `GridsomeContentItem`: 'linkResolver` has been renamed to `urlSlugResolver`
        * `deliveryClientConfig`: Please review the [Kentico Kontent documentation](https://github.com/Kentico/kentico-kontent-js/blob/master/packages/delivery/DOCS.md#client-configuration) for supported configuration options
    * This update also replaces references to "Kentico Cloud" with "Kentico Kontent" due to the recent rebrand, and has resulted in a rename of this plugin.
    * Closes #7, #8, #9
* Rename Github repo and local folders / origins etc
    * yarn unlink first
    * Update repo description in GitHub
    * Looks like new Azure pipelines will need to be created
    * Don't think there is anything to do on npm
* Create new release
    * Create release branch
    * `yarn run release`
    * Review and commit changes `chore(release): Generate changelog and bump version`
    * Finish release, push
* Make sure Azure pipelines builds and releases
* Deprecate Cloud plugin
    * `npm deprecate @meeg/gridsome-source-kentico-cloud "WARNING: This plugin has been renamed to gridsome-source-kentico-kontent. Please install it instead. Please see https://github.com/CMeeg/gridsome-source-kentico-kontent."`
* Reply to docs PR to ask that
    * Changes on develop are merged in
    * PR retargeted on develop
