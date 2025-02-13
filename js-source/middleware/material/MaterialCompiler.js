import { Color, LineBasicMaterial, MeshPhongMaterial, MeshStandardMaterial, PointsMaterial, ShaderMaterial, SpriteMaterial, Texture, } from "three";
import { Compiler } from "../../core/Compiler";
import { ShaderLibrary } from "../../main";
import { CONFIGTYPE } from "../constants/configType";
export class MaterialCompiler extends Compiler {
    target;
    map;
    constructMap;
    mapAttribute;
    colorAttribute;
    shaderAttribute;
    texturelMap;
    resourceMap;
    cachaColor;
    constructor(parameters) {
        super();
        if (parameters) {
            parameters.target && (this.target = parameters.target);
        }
        else {
            this.target = {};
        }
        this.map = new Map();
        this.texturelMap = new Map();
        this.resourceMap = new Map();
        this.cachaColor = new Color();
        const constructMap = new Map();
        constructMap.set(CONFIGTYPE.MESHSTANDARDMATERIAL, () => new MeshStandardMaterial());
        constructMap.set(CONFIGTYPE.MESHPHONGMATERIAL, () => new MeshPhongMaterial());
        constructMap.set(CONFIGTYPE.SPRITEMATERIAL, () => new SpriteMaterial());
        constructMap.set(CONFIGTYPE.LINEBASICMATERIAL, () => new LineBasicMaterial());
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
        this.colorAttribute = {
            color: true,
            emissive: true,
            specular: true,
        };
        this.mapAttribute = {
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
        this.shaderAttribute = {
            shader: true,
        };
    }
    mergeMaterial(material, config) {
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
        Compiler.applyConfig(config, material, Object.assign(filterMap, this.shaderAttribute));
        material.needsUpdate = true;
        return this;
    }
    getTexture(vid) {
        if (this.texturelMap.has(vid)) {
            const texture = this.texturelMap.get(vid);
            if (texture instanceof Texture) {
                return texture;
            }
            else {
                console.error(`this object which mapped by vid is not instance of Texture: ${vid}`);
                return null;
            }
        }
        else {
            console.error(`texture map can not found this vid: ${vid}`);
            return null;
        }
    }
    linkRescourceMap(map) {
        this.resourceMap = map;
        return this;
    }
    linkTextureMap(textureMap) {
        this.texturelMap = textureMap;
        return this;
    }
    add(vid, config) {
        if (config.type && this.constructMap.has(config.type)) {
            const material = this.constructMap.get(config.type)(config);
            this.mergeMaterial(material, config);
            this.map.set(vid, material);
        }
        else {
            console.warn(`material compiler can not support this type: ${config.type}`);
        }
        return this;
    }
    set(vid, path, key, value) {
        if (!this.map.has(vid)) {
            console.warn(`material compiler set function: can not found material which vid is: '${vid}'`);
            return this;
        }
        const material = this.map.get(vid);
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
    cover(vid, config) {
        if (!this.map.has(vid)) {
            console.warn(`material compiler set function: can not found material which vid is: '${vid}'`);
            return this;
        }
        return this.mergeMaterial(this.map.get(vid), config);
    }
    remove(vid) {
        if (!this.map.has(vid)) {
            console.warn(`material compiler set function: can not found material which vid is: '${vid}'`);
            return this;
        }
        const material = this.map.get(vid);
        material.dispose();
        this.map.delete(vid);
        return this;
    }
    getMap() {
        return this.map;
    }
    setTarget(target) {
        this.target = target;
        return this;
    }
    useEngine(engine) {
        return this;
    }
    compileAll() {
        const target = this.target;
        for (const key in target) {
            this.add(key, target[key]);
        }
        return this;
    }
    dispose() {
        this.map.forEach((material, vid) => {
            material.dispose();
        });
        return this;
    }
}
//# sourceMappingURL=MaterialCompiler.js.map