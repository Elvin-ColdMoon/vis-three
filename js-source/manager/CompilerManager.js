import { validate } from "uuid";
import { Compiler } from "../core/Compiler";
import { AnimationCompiler } from "../middleware/animation/AnimationCompiler";
import { CameraCompiler } from "../middleware/camera/CameraCompiler";
import { ControlsCompiler } from "../middleware/controls/ControlsCompiler";
import { CSS3DCompiler } from "../middleware/css3D/CSS3DCompiler";
import { GeometryCompiler } from "../middleware/geometry/GeometryCompiler";
import { GroupCompiler } from "../middleware/group/GroupCompiler";
import { LightCompiler } from "../middleware/light/LightCompiler";
import { LineCompiler } from "../middleware/line/LineCompiler";
import { MaterialCompiler } from "../middleware/material/MaterialCompiler";
import { MeshCompiler } from "../middleware/mesh/MeshCompiler";
import { ObjectCompiler, } from "../middleware/object/ObjectCompiler";
import { PassCompiler } from "../middleware/pass/PassCompiler";
import { PointsCompiler } from "../middleware/points/PointsCompiler";
import { RendererCompiler } from "../middleware/renderer/RendererCompiler";
import { SceneCompiler } from "../middleware/scene/SceneCompiler";
import { SpriteCompiler } from "../middleware/sprite/SpriteCompiler";
import { TextureCompiler } from "../middleware/texture/TextureCompiler";
import { isValidKey } from "../utils/utils";
export class CompilerManager {
    cameraCompiler = new CameraCompiler();
    lightCompiler = new LightCompiler();
    geometryCompiler = new GeometryCompiler();
    textureCompiler = new TextureCompiler();
    materialCompiler = new MaterialCompiler();
    rendererCompiler = new RendererCompiler();
    sceneCompiler = new SceneCompiler();
    controlsCompiler = new ControlsCompiler();
    spriteCompiler = new SpriteCompiler();
    lineCompiler = new LineCompiler();
    meshCompiler = new MeshCompiler();
    pointsCompiler = new PointsCompiler();
    groupCompiler = new GroupCompiler();
    css3DCompiler = new CSS3DCompiler();
    passCompiler = new PassCompiler();
    animationCompiler = new AnimationCompiler();
    objectCompilerList;
    constructor(parameters) {
        this.objectCompilerList = [];
        if (parameters) {
            Object.keys(parameters).forEach((key) => {
                this[key] = parameters[key];
            });
        }
        // 建立编译器链接
        const textureMap = this.textureCompiler.getMap();
        // 贴图连接
        this.sceneCompiler.linkTextureMap(textureMap);
        this.materialCompiler.linkTextureMap(textureMap);
        this.animationCompiler.linkTextureMap(textureMap);
        // 物体几何连接，材质连接，物体连接
        const geometryMap = this.geometryCompiler.getMap();
        const materialMap = this.materialCompiler.getMap();
        this.objectCompilerList = Object.values(this).filter((object) => object instanceof ObjectCompiler);
        const objectMapList = this.objectCompilerList.map((compiler) => compiler.getMap());
        for (const objectCompiler of this.objectCompilerList) {
            if (isValidKey("IS_SOLIDOBJECTCOMPILER", objectCompiler)) {
                objectCompiler
                    .linkGeometryMap(geometryMap)
                    .linkMaterialMap(materialMap);
            }
            objectCompiler.linkObjectMap(...objectMapList);
        }
        this.animationCompiler
            .linkObjectMap(...objectMapList)
            .linkMaterialMap(materialMap);
    }
    /**
     * engine进行编译器链接
     * @param engine EngineSupport
     * @returns this
     */
    support(engine) {
        // 根据engine设置
        Object.values(this)
            .filter((object) => object instanceof Compiler)
            .forEach((compiler) => {
            compiler.useEngine(engine);
        });
        // 动态资源连接
        if (engine.resourceManager) {
            const resourceMap = engine.resourceManager.resourceMap;
            this.textureCompiler.linkRescourceMap(resourceMap);
            this.geometryCompiler.linkRescourceMap(resourceMap);
            this.css3DCompiler.linkRescourceMap(resourceMap);
        }
        const dataSupportManager = engine.dataSupportManager;
        // 添加通知 TODO: 注意生命周期 lookAt group等
        dataSupportManager.textureDataSupport.addCompiler(this.textureCompiler);
        dataSupportManager.materialDataSupport.addCompiler(this.materialCompiler);
        dataSupportManager.geometryDataSupport.addCompiler(this.geometryCompiler);
        dataSupportManager.rendererDataSupport.addCompiler(this.rendererCompiler);
        dataSupportManager.controlsDataSupport.addCompiler(this.controlsCompiler);
        dataSupportManager.passDataSupport.addCompiler(this.passCompiler);
        dataSupportManager.cameraDataSupport.addCompiler(this.cameraCompiler);
        dataSupportManager.lightDataSupport.addCompiler(this.lightCompiler);
        dataSupportManager.spriteDataSupport.addCompiler(this.spriteCompiler);
        dataSupportManager.lineDataSupport.addCompiler(this.lineCompiler);
        dataSupportManager.meshDataSupport.addCompiler(this.meshCompiler);
        dataSupportManager.pointsDataSupport.addCompiler(this.pointsCompiler);
        dataSupportManager.css3DDataSupport.addCompiler(this.css3DCompiler);
        dataSupportManager.groupDataSupport.addCompiler(this.groupCompiler);
        dataSupportManager.sceneDataSupport.addCompiler(this.sceneCompiler);
        dataSupportManager.animationDataSupport.addCompiler(this.animationCompiler);
        return this;
    }
    /**
     * 获取该three物体的vid标识
     * @param object three object
     * @returns vid or null
     */
    getObjectSymbol(object) {
        const objectCompilerList = this.objectCompilerList;
        for (const compiler of objectCompilerList) {
            const vid = compiler.getObjectSymbol(object);
            if (vid) {
                return vid;
            }
        }
        return null;
    }
    /**
     * 通过vid标识获取相应的three对象
     * @param vid vid标识
     * @returns object3D || null
     */
    getObjectBySymbol(vid) {
        const objectCompilerList = this.objectCompilerList;
        for (const compiler of objectCompilerList) {
            const object = compiler.getMap().get(vid);
            if (object) {
                return object;
            }
        }
        return null;
    }
    /**
     * @deprecated
     */
    getMaterial(vid) {
        if (!validate(vid)) {
            console.warn(`compiler manager vid is illeage: ${vid}`);
            return undefined;
        }
        const materialCompiler = this.materialCompiler;
        return materialCompiler.getMap().get(vid);
    }
    /**
     * @deprecated
     */
    getTexture(vid) {
        if (!validate(vid)) {
            console.warn(`compiler manager vid is illeage: ${vid}`);
            return undefined;
        }
        const textureCompiler = this.textureCompiler;
        return textureCompiler.getMap().get(vid);
    }
    /**
     * @deprecated
     * @returns
     */
    getObjectCompilerList() {
        return this.objectCompilerList;
    }
    dispose() {
        Object.keys(this).forEach((key) => {
            if (this[key] instanceof Compiler) {
                this[key].dispose();
            }
        });
        this.objectCompilerList = [];
        return this;
    }
}
//# sourceMappingURL=CompilerManager.js.map