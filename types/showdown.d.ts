declare module "showdown" {
  export interface ConverterOptions {
    tables?: boolean;
    simpleLineBreaks?: boolean;
    strikethrough?: boolean;
    tasklists?: boolean;
    openLinksInNewWindow?: boolean;
  }

  export class Converter {
    constructor(options?: ConverterOptions);
    makeHtml(markdown: string): string;
  }
}
