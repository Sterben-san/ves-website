import type { DetailedHTMLProps, HTMLAttributes } from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "media-controller": DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        nohotkeys?: boolean;
      };
    }
  }
}
