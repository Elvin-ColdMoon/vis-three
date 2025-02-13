import { validate } from "uuid";
import { ProxyNotice } from "../../core/ProxyBroadcast";
import { Rule } from "../../core/Rule";
import { TextureCompiler } from "./TextureCompiler";

export const TextureRule: Rule<TextureCompiler> = function (
  notice: ProxyNotice,
  compiler: TextureCompiler
) {
  const { operate, key, path, value } = notice;

  if (operate === "add") {
    if (validate(key)) {
      compiler.add(key, value);
    }
    return;
  }

  if (operate === "set") {
    const tempPath = path.concat([]);
    const vid = tempPath.shift() || key;
    if (vid && validate(vid)) {
      compiler.set(vid, tempPath, key, value);
    } else {
      console.warn(`texture rule vid is illeage: '${vid}'`);
    }
    return;
  }

  if (operate === "delete") {
    const vid = path[0] || key;
    if (validate(vid)) {
      compiler.remove(vid);
    } else {
      console.warn(`texture rule vid is illeage: '${vid}'`);
    }
    return;
  }
};
