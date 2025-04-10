declare module 'lit' {
  export class LitElement extends HTMLElement {
    protected render(): TemplateResult;
    protected firstUpdated(): void;
  }

  export type TemplateResult = {
    strings: TemplateStringsArray;
    values: any[];
  };

  export function html(strings: TemplateStringsArray, ...values: any[]): TemplateResult;
}

declare module 'lit/decorators.js' {
  export function customElement(tagName: string): ClassDecorator;
  export function property(options?: { attribute?: boolean | string }): PropertyDecorator;
  export function state(): PropertyDecorator;
}
