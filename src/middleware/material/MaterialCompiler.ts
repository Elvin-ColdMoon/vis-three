import {
  Color,
  LineBasicMaterial,
  Material,
  MeshBasicMaterial,
  MeshPhongMaterial,
  MeshStandardMaterial,
  PointsMaterial,
  ShaderMaterial,
  SpriteMaterial,
  Texture,
} from "three";
import { Compiler, CompilerTarget } from "../../core/Compiler";
import { EngineSupport, ShaderLibrary } from "../../main";
import { SymbolConfig } from "../common/CommonConfig";
import { CONFIGTYPE } from "../constants/configType";
import { MODULETYPE } from "../constants/MODULETYPE";
import { MaterialAllType } from "./MaterialConfig";

export interface MaterialCompilerTarget extends CompilerTarget {
  [key: string]: MaterialAllType;
}

export class MaterialCompiler extends Compiler {
  MODULE: MODULETYPE = MODULETYPE.MATERIAL;

  private target: MaterialCompilerTarget = {};

  private map = new Map<SymbolConfig["vid"], Material>();

  private weakMap = new WeakMap<Material, SymbolConfig["vid"]>();

  private constructMap = new Map<
    SymbolConfig["type"],
    (config: MaterialAllType) => Material
  >();

  private mapAttribute: { [key: string]: boolean } = {
    roughnessMap: true,
    normalMap: true,
    metalnessMap: true,
    map: true,
    lightMap: true,
    envMap: true,
    emissiveMap: true,
    displacementMap: true,
    bumpMap: true,
    alphaMap: true,
    aoMap: true,
    specularMap: true,
  };

  private colorAttribute: { [key: string]: boolean } = {
    color: true,
    emissive: true,
    specular: true,
  };

  private shaderAttribute: { [key: string]: boolean } = {
    shader: true,
  };

  private texturelMap = new Map<string, Texture>();
  private resourceMap = new Map<string, unknown>();

  private cachaColor = new Color();

  constructor() {
    super();

    const constructMap = new Map();

    constructMap.set(
      CONFIGTYPE.MESHBASICMATERIAL,
      () => new MeshBasicMaterial()
    );
    constructMap.set(
      CONFIGTYPE.MESHSTANDARDMATERIAL,
      () => new MeshStandardMaterial()
    );
    constructMap.set(
      CONFIGTYPE.MESHPHONGMATERIAL,
      () => new MeshPhongMaterial()
    );
    constructMap.set(CONFIGTYPE.SPRITEMATERIAL, () => new SpriteMaterial());
    constructMap.set(
      CONFIGTYPE.LINEBASICMATERIAL,
      () => new LineBasicMaterial()
    );
    constructMap.set(CONFIGTYPE.POINTSMATERIAL, () => new PointsMaterial());
    constructMap.set(CONFIGTYPE.SHADERMATERIAL, (config) => {
      const shader = ShaderLibrary.getShader(config.shader);
      const material = new ShaderMaterial();
      shader?.vertexShader && (material.vertexShader = shader.vertexShader);
      shader?.fragmentShader &&
        (material.fragmentShader = shader.fragmentShader);
      shader?.uniforms && (material.uniforms = shader.uniforms);

      return material;
    });

    this.constructMap = constructMap;
  }

  private mergeMaterial(material: Material, config: MaterialAllType): this {
    const tempConfig = JSON.parse(JSON.stringify(config));

    const filterMap = {};
    // 转化颜色
    const colorAttribute = this.colorAttribute;
    for (const key in colorAttribute) {
      if (tempConfig[key]) {
        material[key] = new Color(tempConfig[key]);
        filterMap[key] = true;
      }
    }
    // 应用贴图
    const mapAttribute = this.mapAttribute;
    for (const key in mapAttribute) {
      if (tempConfig[key]) {
        material[key] = this.getTexture(tempConfig[key]);
        filterMap[key] = true;
      }
    }
    // 应用属性
    Compiler.applyConfig(
      config,
      material,
      Object.assign(filterMap, this.shaderAttribute)
    );

    material.needsUpdate = true;
    return this;
  }

  private getTexture(vid: string): Texture | null {
    if (this.texturelMap.has(vid)) {
      const texture = this.texturelMap.get(vid)!;
      if (texture instanceof Texture) {
        return texture;
      } else {
        console.error(
          `this object which mapped by vid is not instance of Texture: ${vid}`
        );
        return null;
      }
    } else {
      console.error(`texture map can not found this vid: ${vid}`);
      return null;
    }
  }

  linkRescourceMap(map: Map<string, unknown>): this {
    this.resourceMap = map;
    return this;
  }

  linkTextureMap(textureMap: Map<SymbolConfig["vid"], Texture>): this {
    this.texturelMap = textureMap;
    return this;
  }

  add(vid: string, config: MaterialAllType): this {
    if (config.type && this.constructMap.has(config.type)) {
      const material = this.constructMap.get(config.type)!(config);
      this.mergeMaterial(material, config);
      this.map.set(vid, material);
      this.weakMap.set(material, vid);
    } else {
      console.warn(
        `material compiler can not support this type: ${config.type}`
      );
    }
    return this;
  }

  set(vid: string, path: string[], key: string, value: any): this {
    if (!this.map.has(vid)) {
      console.warn(
        `material compiler set function: can not found material which vid is: '${vid}'`
      );
      return this;
    }

    const material = this.map.get(vid)!;

    // 颜色
    if (this.colorAttribute[key]) {
      material[key] = new Color(value);
      return this;
    }

    // 贴图
    if (this.mapAttribute[key]) {
      material[key] = this.getTexture(value);
      material.needsUpdate = true;
      return this;
    }

    let config = material;
    path.forEach((key, i, arr) => {
      config = config[key];
    });
    config[key] = value;

    return this;
  }

  cover(vid: string, config: MaterialAllType): this {
    if (!this.map.has(vid)) {
      console.warn(
        `material compiler set function: can not found material which vid is: '${vid}'`
      );
      return this;
    }

    return this.mergeMaterial(this.map.get(vid)!, config);
  }

  remove(vid: string) {
    if (!this.map.has(vid)) {
      console.warn(
        `material compiler set function: can not found material which vid is: '${vid}'`
      );
      return this;
    }

    const material = this.map.get(vid)!;

    material.dispose();
    this.map.delete(vid);
    this.weakMap.delete(material);
    return this;
  }

  getMap(): Map<SymbolConfig["vid"], Material> {
    return this.map;
  }

  setTarget(target: MaterialCompilerTarget): this {
    this.target = target;
    return this;
  }

  useEngine(engine: EngineSupport): this {
    return this;
  }

  compileAll(): this {
    const target = this.target;
    for (const key in target) {
      this.add(key, target[key]);
    }
    return this;
  }

  dispose(): this {
    this.map.forEach((material, vid) => {
      material.dispose();
    });
    return this;
  }

  getObjectSymbol(object: Material): string | null {
    return this.weakMap.get(object) || null;
  }

  getObjectBySymbol(vid: string): any | null {
    return this.map.get(vid) || null;
  }
}
