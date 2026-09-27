declare module 'turndown' {
  export interface TurndownRule {
    filter: string | string[] | ((node: HTMLElement, options: Record<string, unknown>) => boolean);
    replacement: (content: string, node: HTMLElement, options: Record<string, unknown>) => string;
  }

  export interface TurndownOptions {
    headingStyle?: 'setext' | 'atx';
    hr?: string;
    bulletListMarker?: '-' | '+' | '*';
    codeBlockStyle?: 'indented' | 'fenced';
    emDelimiter?: '_' | '*';
    strongDelimiter?: '__' | '**';
    linkStyle?: 'inlined' | 'referenced';
    linkReferenceStyle?: 'full' | 'collapsed' | 'shortcut';
    preformattedCode?: boolean;
    [key: string]: unknown;
  }

  export default class TurndownService {
    constructor(options?: TurndownOptions);
    turndown(html: string): string;
    use(plugin: unknown): this;
    addRule(key: string, rule: TurndownRule): this;
    keep(filter: string | string[] | ((node: HTMLElement) => boolean)): this;
    remove(filter: string | string[] | ((node: HTMLElement) => boolean)): this;
  }
}
