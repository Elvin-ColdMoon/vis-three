import { Object3D } from "three";
import { Rule } from "../../core/Rule";
import {
  SolidObject3D,
  SolidObjectCompiler,
  SolidObjectCompilerTarget,
} from "./SolidObjectCompiler";
import { SolidObjectConfig } from "./SolidObjectConfig";

export type SolidObjectRule<
  E extends SolidObjectCompiler<C, T, O>,
  C extends SolidObjectConfig,
  T extends SolidObjectCompilerTarget<C>,
  O extends SolidObject3D
> = Rule<E>;
