import { Object3D } from "three";
import {
  Engine,
  SetCameraEvent,
  SetDomEvent,
  SetSceneEvent,
} from "../engine/Engine";
import { GlobalEvent } from "../manager/EventManager";
import {
  ObjectChangedEvent,
  TRANSFORMEVENT,
  VisTransformControls,
} from "../optimize/VisTransformControls";
import { Plugin } from "./plugin";
import { ObjectConfig } from "../middleware/object/ObjectConfig";
import { SelectedEvent } from "./SelectionPlugin";

export const TransformControlsPlugin: Plugin<Object> = function (
  this: Engine,
  params: Object
): boolean {
  if (this.transformControls) {
    console.warn("this has installed transformControls plugin.");
    return false;
  }

  if (!this.pointerManager) {
    console.warn(
      "this must install pointerManager before install transformControls plugin."
    );
    return false;
  }

  if (!this.eventManager) {
    console.warn(
      "this must install eventManager before install transformControls plugin."
    );
    return false;
  }

  const transformControls = new VisTransformControls(this.camera!, this.dom!);
  transformControls.detach();

  this.transformControls = transformControls;

  this.scene!.add(this.transformControls);
  this.scene!.add((this.transformControls as VisTransformControls).target);

  this.setTransformControls = function (show: boolean): Engine {
    if (show) {
      this.scene!.add(this.transformControls!);
    } else {
      this.scene!.remove(this.transformControls!);
    }
    return this;
  };

  this.addEventListener<SetCameraEvent>("setCamera", (event) => {
    transformControls.setCamera(event.camera);
  });

  this.addEventListener<SetDomEvent>("setDom", (event) => {
    transformControls.setDom(event.dom);
  });

  this.addEventListener<SetSceneEvent>("setScene", (event) => {
    const scene = event.scene;
    scene.add((this.transformControls as VisTransformControls).target);
    scene.add(this.transformControls!);
  });

  // 与selection联调
  if (this.selectionBox) {
    this.addEventListener<SelectedEvent>("selected", (event) => {
      transformControls.setAttach(...event.objects);
    });
  } else {
    this.eventManager.addEventListener<GlobalEvent>("pointerup", (event) => {
      if (this.transformControls!.dragging) {
        return;
      }
      if (event.button === 0) {
        const objectList = event.intersections.map((elem) => elem.object);
        const object = objectList[0] || null;
        if (object) {
          transformControls.setAttach(object);
        } else {
          transformControls.detach();
        }
      }
    });
  }

  // 与eventManager作用
  this.eventManager!.addFilterObject(transformControls);

  this.completeSet.add(() => {
    if (this.IS_ENGINESUPPORT) {
      const objectToConfig = (object: Object3D): ObjectConfig | null => {
        const symbol = this.compilerManager!.getObjectSymbol(object);
        if (!symbol) {
          return null;
        }

        return this.dataSupportManager!.getConfigBySymbol(symbol);
      };

      let config: ObjectConfig | null = null;
      let mode: string;
      transformControls.addEventListener(
        TRANSFORMEVENT.OBJECTCHANGED,
        (event) => {
          const e = event as unknown as ObjectChangedEvent;

          e.transObjectSet.forEach((object) => {
            config = objectToConfig(object);
            mode = e.mode;
            if (config) {
              config[mode].x = object[mode].x;
              config[mode].y = object[mode].y;
              config[mode].z = object[mode].z;
            }
          });
        }
      );
    }
  });

  return true;
};
