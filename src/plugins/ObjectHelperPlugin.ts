import { Color, Object3D, Scene, Sprite } from "three";
import { Engine, SetSceneEvent } from "../engine/Engine";
import { Plugin } from "./plugin";
import { SelectedEvent } from "./SelectionPlugin";
import { ObjectHelperManager } from "../manager/ObjectHelperManager";

export interface ObjectHelperParameters {
  interact?: boolean;
  activeColor?: string;
  hoverColor?: string;
  defaultColor?: string;
  selectedColor?: string;
}

export const ObjectHelperPlugin: Plugin<ObjectHelperParameters> = function (
  this: Engine,
  params: ObjectHelperParameters = {}
): boolean {
  if (!this.scene) {
    console.error("must install some scene plugin before ObjectHelper plugin.");
    return false;
  }

  if (params.interact === undefined) {
    params.interact = true;
  }

  if (params.interact) {
    if (!this.eventManager) {
      console.warn(
        "must install eventManager plugin that can use interact function."
      );
      params.interact = false;
    }
  }

  const helperManager = new ObjectHelperManager();
  const pointerenterFunMap = new Map<Object3D, Function>();
  const pointerleaveFunMap = new Map<Object3D, Function>();
  const clickFunMap = new Map<Object3D, Function>();
  const helperMap = helperManager.helperMap;

  this.objectHelperManager = helperManager;

  !params.activeColor && (params.activeColor = "rgb(230, 20, 240)");
  !params.hoverColor && (params.hoverColor = "rgb(255, 158, 240)");
  !params.defaultColor && (params.defaultColor = "rgb(255, 255, 255)");
  !params.selectedColor && (params.selectedColor = params.activeColor);

  const defaultColorHex = new Color(params.defaultColor).getHex();
  const activeColorHex = new Color(params.activeColor).getHex();
  const hoverColorHex = new Color(params.hoverColor).getHex();
  const selectedColorHex = new Color(params.selectedColor).getHex();

  const cacheSceneSet = new WeakSet<Scene>();

  const afterAddFun = (event) => {
    const objects = event.objects;

    for (const object of objects) {
      const helper = helperManager.addObjectHelper(object) as Sprite;

      if (!helper) {
        continue;
      }
      helper.material.color.setHex(defaultColorHex);

      this.scene.add(helper);

      if (params.interact) {
        const pointerenterFun = () => {
          if (this.transformControls?.dragging) {
            return;
          }
          if (this.selectionBox) {
            if (this.selectionBox.has(object)) {
              return;
            }
          }
          helper.material.color.setHex(hoverColorHex);
        };

        const pointerleaveFun = () => {
          if (this.transformControls?.dragging) {
            return;
          }
          if (this.selectionBox) {
            if (this.selectionBox.has(object)) {
              return;
            }
          }

          helper.material.color.setHex(defaultColorHex);
        };

        const clickFun = () => {
          if (this.transformControls?.dragging) {
            return;
          }
          if (this.selectionBox) {
            if (this.selectionBox.has(object)) {
              return;
            }
          }
          helper.material.color.setHex(activeColorHex);
        };

        object.addEventListener("pointerenter", pointerenterFun);
        object.addEventListener("pointerleave", pointerleaveFun);
        object.addEventListener("click", clickFun);

        pointerenterFunMap.set(object, pointerenterFun);
        pointerleaveFunMap.set(object, pointerleaveFun);
        clickFunMap.set(object, clickFun);
      }
    }
  };

  const afterRemoveFun = (event) => {
    const objects = event.objects;

    for (const object of objects) {
      const helper = helperManager.disposeObjectHelper(object);

      if (!helper) {
        continue;
      }

      this.scene.remove(helper);

      if (params.interact) {
        object.removeEventListener(
          "pointerenter",
          pointerenterFunMap.get(object)
        );
        object.removeEventListener(
          "pointerleave",
          pointerleaveFunMap.get(object)
        );
        object.removeEventListener("click", clickFunMap.get(object));

        pointerenterFunMap.delete(object);
        pointerleaveFunMap.delete(object);
        clickFunMap.delete(object);
      }
    }
  };

  const initSceneHelper = (scene) => {
    if (cacheSceneSet.has(scene)) {
      return;
    }

    scene.traverse((object) => {
      const helper = helperManager.addObjectHelper(object);
      helper && scene.add(helper);
    });
    cacheSceneSet.add(scene);
  };

  this.scene.addEventListener("afterAdd", afterAddFun);

  this.scene.addEventListener("afterRemove", afterRemoveFun);

  this.setObjectHelper = function (params: { show: boolean }): Engine {
    // TODO: 分开scene
    if (params.show) {
      helperMap.forEach((helper) => {
        this.scene.add(helper);
      });
    } else {
      helperMap.forEach((helper) => {
        this.scene.remove(helper);
      });
    }
    return this;
  };

  this.addEventListener<SetSceneEvent>("setScene", (event) => {
    const scene = event.scene;
    // 初始化场景辅助
    !cacheSceneSet.has(scene) && initSceneHelper(scene);

    if (!scene.hasEventListener("afterAdd", afterAddFun)) {
      scene.addEventListener("afterAdd", afterAddFun);
    }

    if (!scene.hasEventListener("afterRemove", afterRemoveFun)) {
      scene.addEventListener("afterRemove", afterRemoveFun);
    }
  });

  const cacheObjectsHelper = new Set<Object3D>();

  this.completeSet.add(() => {
    if (this.selectionBox) {
      this.addEventListener<SelectedEvent>("selected", (event) => {
        cacheObjectsHelper.forEach((helper) => {
          (helper as Sprite).material.color.setHex(defaultColorHex);
        });
        cacheObjectsHelper.clear();

        for (const object of event.objects) {
          if (helperMap.has(object)) {
            const helper = helperMap.get(object) as Sprite;
            helper.material.color.setHex(selectedColorHex);
            cacheObjectsHelper.add(helper);
          }
        }
      });
    }
  });
  return true;
};
