import { Object3D, Scene, Vector3 } from "three";
import { Compiler, CompilerTarget } from "../../core/Compiler";
import { EngineSupport } from "../../engine/EngineSupport";
import {
  BasicEventConfig,
  EventLibrary,
} from "../../library/event/EventLibrary";
import { EVENTNAME, ObjectEvent } from "../../manager/EventManager";
import { SymbolConfig } from "../common/CommonConfig";
import { ObjectConfig } from "./ObjectConfig";

export type BasicObjectCompiler = ObjectCompiler<
  ObjectConfig,
  ObjectCompilerTarget<ObjectConfig>,
  Object3D
>;
export interface ObjectCompilerTarget<C extends ObjectConfig>
  extends CompilerTarget {
  [key: string]: C;
}

export interface CacheObjectData {
  lookAtTarget: Vector3 | null;
  updateMatrixWorldFun: ((focus: boolean) => void) | null;
}

export interface FilterAttribute {
  [key: string]: FilterAttribute | boolean;
}

export abstract class ObjectCompiler<
  C extends ObjectConfig,
  T extends ObjectCompilerTarget<C>,
  O extends Object3D
> extends Compiler {
  static eventSymbol = "vis.event";

  IS_OBJECTCOMPILER = true;

  protected target!: T;
  protected map: Map<SymbolConfig["vid"], O>;
  protected weakMap: WeakMap<O, SymbolConfig["vid"]>;

  protected objectCacheMap: WeakMap<O, CacheObjectData>;

  protected objectMapSet: Set<Map<SymbolConfig["vid"], Object3D>>;

  // merge属性的时候会直接被过滤的属性
  protected filterAttribute: FilterAttribute = {
    lookAt: true,
    parent: true,
    children: true,
    pointerdown: true,
    pointermove: true,
    pointerup: true,
    pointerenter: true,
    pointerleave: true,
    click: true,
    dblclick: true,
    contextmenu: true,
  };

  engine!: EngineSupport;

  constructor() {
    super();

    this.map = new Map();
    this.weakMap = new WeakMap();
    this.objectMapSet = new Set();
    this.objectCacheMap = new WeakMap();
  }

  // 获取物体
  getObject(vid: string): Object3D | null {
    for (const map of this.objectMapSet) {
      if (map.has(vid)) {
        return map.get(vid)!;
      }
    }
    return null;
  }

  protected mergeFilterAttribute(object: FilterAttribute): this {
    const recursion = (config: FilterAttribute, merge: FilterAttribute) => {
      for (const key in merge) {
        if (config[key] === undefined) {
          config[key] = merge[key];
          continue;
        }
        if (typeof merge[key] === "object") {
          recursion(
            config[key] as FilterAttribute,
            merge[key] as FilterAttribute
          );
        } else {
          config[key] = merge[key];
        }
      }
    };
    recursion(this.filterAttribute, object);
    return this;
  }

  // 设置物体的lookAt方法
  protected setLookAt(vid: string, target: string): this {
    // 不能自己看自己
    if (vid === target) {
      console.error(`can not set object lookAt itself.`);
      return this;
    }

    if (!this.map.has(vid)) {
      console.error(
        `${this.MODULE}Compiler: can not found object which vid: ${vid}.`
      );
      return this;
    }

    const model = this.map.get(vid)!;
    let cacheData = this.objectCacheMap.get(model);

    if (!cacheData) {
      cacheData = { lookAtTarget: null, updateMatrixWorldFun: null };
      this.objectCacheMap.set(model, cacheData);
    }

    if (!target) {
      if (!cacheData.updateMatrixWorldFun) {
        return this;
      }

      model.updateMatrixWorld = cacheData.updateMatrixWorldFun;
      cacheData.lookAtTarget = null;
      cacheData.updateMatrixWorldFun = null;
      return this;
    }

    const lookAtTarget = this.getObject(target);

    if (!lookAtTarget) {
      console.warn(
        `${this.MODULE}Compiler: can not found this vid mapping object: '${vid}'`
      );
      return this;
    }

    const updateMatrixWorldFun = model.updateMatrixWorld;

    cacheData.updateMatrixWorldFun = updateMatrixWorldFun;
    cacheData.lookAtTarget = lookAtTarget.position;

    model.updateMatrixWorld = (focus: boolean) => {
      updateMatrixWorldFun.bind(model)(focus);
      model.lookAt(cacheData!.lookAtTarget!);
    };

    return this;
  }

  // 添加物体事件
  addEvent(vid: string, eventName: EVENTNAME, config: BasicEventConfig): this {
    if (!this.map.has(vid)) {
      console.warn(`${this.MODULE} compiler : No matching vid found: ${vid}`);
      return this;
    }
    if (!EventLibrary.has(config.name)) {
      console.warn(
        `${this.MODULE} compiler: can not support this event: ${config.name}`
      );
      return this;
    }

    const object = this.map.get(vid)! as unknown as Object3D<ObjectEvent>;

    // 生成函数
    const fun = EventLibrary.generateEvent(config, this.engine);

    // 映射缓存
    const symbol = Symbol.for(ObjectCompiler.eventSymbol);
    config[symbol] = fun;

    // 绑定事件
    object.addEventListener(eventName, fun);
    return this;
  }

  // 移除事件
  removeEvent(
    vid: string,
    eventName: EVENTNAME,
    config: BasicEventConfig
  ): this {
    if (!this.map.has(vid)) {
      console.warn(`${this.MODULE} compiler: No matching vid found: ${vid}`);
      return this;
    }

    const object = this.map.get(vid)! as unknown as Object3D<ObjectEvent>;

    const fun = config[Symbol.for(ObjectCompiler.eventSymbol)];

    if (!fun) {
      console.warn(
        `${this.MODULE} compiler: event remove can not fun found event in config`,
        config
      );
      return this;
    }

    object.removeEventListener(eventName, fun!);
    delete config[Symbol.for(ObjectCompiler.eventSymbol)];

    return this;
  }

  // 更新事件
  updateEvent(vid: string, eventName: EVENTNAME, index: number): this {
    if (!this.map.has(vid)) {
      console.warn(`${this.MODULE} compiler: No matching vid found: ${vid}`);
      return this;
    }

    const object = this.map.get(vid)! as unknown as Object3D<ObjectEvent>;
    const symbol = Symbol.for(ObjectCompiler.eventSymbol);

    const config = this.target[vid][eventName][index];

    const fun = config[symbol];

    if (!fun) {
      console.warn(
        `${this.MODULE} compiler: can not fun found event: ${vid}, ${eventName}, ${index}`
      );
      return this;
    }

    object.removeEventListener(eventName, fun!);

    // 生成函数
    const newFun = EventLibrary.generateEvent(config, this.engine);

    // 映射缓存
    config[symbol] = fun;

    // 绑定事件
    object.addEventListener(eventName, newFun);
    return this;
  }

  // 添加子项
  addChildren(vid: string, target: string): this {
    if (!this.map.has(vid)) {
      console.warn(
        `${this.MODULE} compiler: can not found this vid in compiler: ${vid}.`
      );
      return this;
    }

    const object = this.map.get(vid)!;

    const targetObject = this.getObject(target);

    if (!targetObject) {
      console.warn(
        `${this.MODULE} compiler: can not found this vid in compiler: ${target}.`
      );
      return this;
    }

    object.add(targetObject);

    // 更新target对象的parent
    const targetConfig = this.engine.getConfigBySymbol<ObjectConfig>(target);
    if (!targetConfig) {
      console.warn(
        `${this.MODULE} compiler: can not foud object config: ${target}`
      );
      return this;
    }

    targetConfig.parent = vid;
    return this;
  }

  // 移除子项
  removeChildren(vid: string, target: string): this {
    if (!this.map.has(vid)) {
      console.warn(
        `${this.MODULE} compiler: can not found this vid in compiler: ${vid}.`
      );
      return this;
    }

    const object = this.map.get(vid)!;

    const targetObject = this.getObject(target);

    if (!targetObject) {
      console.warn(
        `${this.MODULE} compiler: can not found this vid in compiler: ${target}.`
      );
      return this;
    }

    object.remove(targetObject);

    // 更新target对象的parent
    const targetConfig = this.engine.getConfigBySymbol<ObjectConfig>(target);
    if (!targetConfig) {
      console.warn(
        `${this.MODULE} compiler: remove children function can not foud object config: ${target}`
      );
      return this;
    }

    targetConfig.parent = "";
    return this;
  }

  linkObjectMap(...map: Map<SymbolConfig["vid"], Object3D>[]): this {
    for (const objectMap of map) {
      if (!this.objectMapSet.has(objectMap)) {
        this.objectMapSet.add(objectMap);
      }
    }
    return this;
  }

  useEngine(engine: EngineSupport): this {
    this.engine = engine;
    return this;
  }

  setTarget(target: T): this {
    this.target = target;
    return this;
  }

  getMap(): Map<SymbolConfig["type"], Object3D> {
    return this.map;
  }

  getObjectSymbol(object: O): SymbolConfig["vid"] | null {
    return this.weakMap.get(object) || null;
  }

  getObjectBySymbol(vid: string): O | null {
    return this.map.get(vid) || null;
  }

  compileAll(): this {
    const target = this.target;
    for (const key in target) {
      this.add(key, target[key]);
    }
    return this;
  }

  add(vid: string, config: T[string]): this {
    const object = this.map.get(vid);

    if (!object) {
      console.error(`${this.MODULE} compiler can not finish add method.`);
      return this;
    }

    const asyncFun = Promise.resolve();

    // 兼容生命周期
    asyncFun.then(() => {
      // lookAt
      this.setLookAt(vid, config.lookAt);

      // children
      if (config.children.length) {
        for (const target of config.children) {
          this.addChildren(vid, target);
        }
      }

      // event
      for (const eventName of Object.values(EVENTNAME)) {
        const eventList = config[eventName];
        if (eventList.length) {
          for (const event of eventList) {
            this.addEvent(vid, eventName, event);
          }
        }
      }
    });

    Compiler.applyConfig(config, object, this.filterAttribute);

    object.updateMatrix();
    object.updateMatrixWorld();
    return this;
  }

  set(vid: string, path: string[], key: string, value: any): this {
    if (!this.map.has(vid)) {
      console.warn(
        `${this.MODULE} compiler can not found this vid mapping object: '${vid}'`
      );
      return this;
    }

    // lookAt
    if (key === "lookAt") {
      return this.setLookAt(vid, value);
    }

    // merge
    let object = this.map.get(vid)!;
    let filter = this.filterAttribute;

    for (const key of path) {
      if (filter[key]) {
        if (filter[key] === true) {
          return this;
        } else {
          filter = filter[key] as FilterAttribute;
        }
      }
      object = object[key];
    }

    object[key] = value;

    return this;
  }

  cover(vid: string, config: T[string]): this {
    const object = this.map.get(vid);

    if (!object) {
      console.error(`${this.MODULE} compiler can not found object: ${vid}.`);
      return this;
    }

    const asyncFun = Promise.resolve();
    asyncFun.then(() => {
      // lookAt
      this.setLookAt(vid, config.lookAt);

      // children
      if (config.children.length) {
        for (const target of config.children) {
          this.addChildren(vid, target);
        }
      }

      // event
      for (const eventName of Object.values(EVENTNAME)) {
        // 情空object eventName
        // @ts-ignore
        if (object._listeners && object._listeners[eventName]) {
          // @ts-ignore
          object._listeners[eventName] = [];
        }

        const eventList = config[eventName];
        if (eventList.length) {
          for (const event of eventList) {
            this.addEvent(vid, eventName, event);
          }
        }
      }
    });

    Compiler.applyConfig(config, object, this.filterAttribute);
    return this;
  }

  remove(vid: string, config: T[string]): this {
    if (!this.map.has(vid)) {
      console.warn(
        `${this.MODULE}Compiler: can not found object which vid: ${vid}.`
      );
      return this;
    }

    // 从parent 配置中移除
    if (config.parent) {
      const parentConfig = this.engine.getConfigBySymbol(
        config.parent
      ) as ObjectConfig;

      if (!parentConfig) {
        console.warn(
          `${this.MODULE} compiler: can not found parent object config: ${config.parent}`
        );
      } else {
        if (parentConfig.children.includes(vid)) {
          parentConfig.children.splice(parentConfig.children.indexOf(vid), 1);
        } else {
          console.warn(
            `${this.MODULE} compiler: can not found vid in its parent config: ${vid}`
          );
        }
      }
    }

    const object = this.map.get(vid)!;

    this.weakMap.delete(object);
    this.objectCacheMap.delete(this.map.get(vid)!);
    this.map.delete(vid);
    return this;
  }

  dispose(): this {
    this.map.clear();
    this.objectMapSet.clear();
    return this;
  }
}
