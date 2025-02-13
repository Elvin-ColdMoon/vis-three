import { DataSupport } from "../../core/DataSupport";
import { IgnoreAttribute } from "../../core/ProxyBroadcast";
import { MODULETYPE } from "../constants/MODULETYPE";
import { RendererCompiler, RendererCompilerTarget } from "./RendererCompiler";
import { getWebGLRendererConfig } from "./RendererConfig";
import { RendererRule } from "./RendererRule";

export class RendererDataSupport extends DataSupport<
  RendererCompilerTarget,
  RendererCompiler
> {
  MODULE: MODULETYPE = MODULETYPE.RENDERER;

  constructor(data?: RendererCompilerTarget, ignore?: IgnoreAttribute) {
    !data && (data = {});
    super(RendererRule, data, ignore);
  }
}
