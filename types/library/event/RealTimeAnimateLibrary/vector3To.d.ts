import { Vector3Config } from "../../../middleware/common/CommonConfig";
import { BasicEventConfig, EventGenerator } from "../EventLibrary";
import { TIMINGFUNCTION } from "./common";
export interface Vector3To extends BasicEventConfig {
  params: {
    target: string;
    attribute: string;
    props: {
      x: string;
      y: string;
      z: string;
    };
    delay: number;
    duration: number;
    to: Partial<Vector3Config>;
    timingFunction: TIMINGFUNCTION;
  };
}
export declare const config: Vector3To;
export declare const generator: EventGenerator<Vector3To>;
