import path from "path";
export default {
  build: {
    lib: {
      entry: path.resolve(__dirname, "../../src/main.ts"),
      name: "Vis",
    },
    rollupOptions: {
      output: {
        chunkFileNames: "[name]-[hash].js",
        entryFileNames: "Vis.[format].js",
        assetFileNames: "static/[name]-[hash].[ext]",
      },
      external: [
        "three",
        "three/examples/jsm/postprocessing/EffectComposer",
        "three/examples/jsm/postprocessing/RenderPass",
        "three/examples/jsm/postprocessing/SMAAPass",
        "three/examples/jsm/postprocessing/UnrealBloomPass",
        "three/examples/jsm/controls/OrbitControls",
        "three/examples/jsm/controls/TransformControls",
        "three/examples/jsm/libs/stats.module",
        "three/examples/jsm/postprocessing/Pass.js",
        "three/examples/jsm/renderers/CSS3DRenderer",
      ],
      plugins: [],
    },
  },
};
