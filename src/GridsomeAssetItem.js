const { ImageUrlBuilder, ImageCompressionEnum, ImageFormatEnum } = require('@kentico/kontent-delivery');

class GridsomeAssetItem {
  constructor(typeName, asset) {
    this.typeName = typeName;
    this.asset = asset;
  }

  createSchema() {
    return {
      types: this.getSchemaTypes(),
      resolvers: this.getSchemaResolvers()
    };
  }

  createNode() {
    return this.asset;
  }

  getSchemaTypes() {
    return [{
      name: this.typeName,
      interfaces: ['Node'],
      fields: {
        name: 'String',
        description: 'String',
        type: 'String',
        size: 'Int',
        url: 'String',
        width: 'Int',
        height: 'Int'
      }
    }];
  }

  getSchemaResolvers() {
    const resolvers = {};

    resolvers[this.typeName] = {
      url: {
        args: {
          width: {
            type: 'Int',
            defaultValue: null
          },
          height: {
            type: 'Int',
            defaultValue: null
          },
          automaticFormat: {
            type: 'Boolean',
            defaultValue: null
          },
          format: {
            type: 'String',
            defaultValue: null
          },
          lossless: {
            type: 'Boolean',
            defaultValue: null
          },
          quality: {
            type: 'Int',
            defaultValue: null
          },
          dpr: {
            type: 'Int',
            defaultValue: null
          }
        },
        resolve (obj, args) {
          const url = obj.url;
          const type = obj.type;

          let urlBuilder = new ImageUrlBuilder(url);

          if (args.width !== null) {
            urlBuilder = urlBuilder.withWidth(args.width);
          }

          if (args.height !== null) {
            urlBuilder = urlBuilder.withHeight(args.height);
          }

          if (args.automaticFormat !== null) {
            if (args.automaticFormat) {
              switch (type.toLowerCase()) {
                case 'image/gif':
                  urlBuilder = urlBuilder.withAutomaticFormat(ImageFormatEnum.Gif)
                  break;
                case 'image/jpeg':
                  urlBuilder = urlBuilder.withAutomaticFormat(ImageFormatEnum.Jpg)
                  break;
                case 'image/png':
                  urlBuilder = urlBuilder.withAutomaticFormat(ImageFormatEnum.Png)
                  break;
              }
            }
          }

          if (args.format !== null) {
            switch (args.format.toLowerCase()) {
              case 'gif':
                urlBuilder = urlBuilder.withFormat(ImageFormatEnum.Gif)
                break;
              case 'jpg':
              case 'jpeg':
                urlBuilder = urlBuilder.withFormat(ImageFormatEnum.Jpg)
                break;
              case 'pjpg':
              case 'pjpeg':
                urlBuilder = urlBuilder.withFormat(ImageFormatEnum.Pjpg)
                break;
              case 'png':
                urlBuilder = urlBuilder.withFormat(ImageFormatEnum.Png)
                break;
              case 'png8':
                urlBuilder = urlBuilder.withFormat(ImageFormatEnum.Png8)
                break;
              case 'webp':
                urlBuilder = urlBuilder.withFormat(ImageFormatEnum.Webp)
                break;
            }
          }

          if (args.lossless !== null) {
            const compression = args.lossless ? ImageCompressionEnum.Lossless : ImageCompressionEnum.Lossy;

            urlBuilder = urlBuilder.withCompression(compression);
          }

          if (args.quality !== null) {
            urlBuilder = urlBuilder.withQuality(args.quality);
          }

          if (args.dpr !== null) {
            urlBuilder = urlBuilder.withDpr(args.dpr);
          }

          return urlBuilder.getUrl();
        }
      }
    };

    return resolvers;
  }
}

module.exports = GridsomeAssetItem;
