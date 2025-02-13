import { CONFIGTYPE } from "../constants/configType";
import { getObjectConfig } from "../object/ObjectConfig";
export const getPerspectiveCameraConfig = function () {
    return Object.assign(getObjectConfig(), {
        type: CONFIGTYPE.PERSPECTIVECAMERA,
        adaptiveWindow: false,
        fov: 45,
        aspect: 1920 / 1080,
        near: 5,
        far: 50,
    });
};
export const getOrthographicCameraConfig = function () {
    return Object.assign(getObjectConfig(), {
        type: CONFIGTYPE.ORTHOGRAPHICCAMERA,
        adaptiveWindow: false,
        left: -1920 / 32,
        right: 1920 / 32,
        top: 1080 / 32,
        bottom: -1080 / 32,
        near: 5,
        far: 50,
        zoom: 1,
    });
};
//# sourceMappingURL=CameraConfig.js.map