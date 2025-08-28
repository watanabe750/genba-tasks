import type { FC, PropsWithChildren } from "react";

export type PageProps = Record<string, never>;
export type PageComponent<P = PageProps> = FC<P & PropsWithChildren>;
