import { ssam } from "ssam";
import type { Sketch, SketchSettings } from "ssam";
import {
  PlaneGeometry,
  Mesh,
  OrthographicCamera,
  Scene,
  ShaderMaterial,
  TextureLoader,
  Vector2,
  WebGLRenderer,
} from "three";
import baseVert from "./shaders/base.vert";
import baseFrag from "./shaders/base.frag";
import { snapdom } from "@zumer/snapdom";
import Croppie from "croppie";
import "croppie/croppie.css";

const sketch: Sketch<"webgl2"> = async ({
  wrap,
  canvas,
  width,
  height,
  pixelRatio,
}) => {
  if (import.meta.hot) {
    import.meta.hot.dispose(() => wrap.dispose());
    import.meta.hot.accept(() => wrap.hotReload());
  }

  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(pixelRatio);

  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const scene = new Scene();

  const uvMap = new TextureLoader().load("/uv_book.png");
  const lightingTexture = new TextureLoader().load("/lighting_book.png");
  const userImage = new TextureLoader().load("/placeholder.jpg");

  const uploadInput = document.getElementById("upload") as HTMLInputElement;
  const cropModal = document.getElementById("crop-modal") as HTMLDivElement;
  const cropImage = document.getElementById("crop-image") as HTMLImageElement;
  const cropButton = document.getElementById(
    "crop-button",
  ) as HTMLButtonElement;
  let cropper: Croppie;
  const filenameInput = document.getElementById("filename") as HTMLInputElement;
  const filenameDisplay = document.getElementsByClassName(
    "filename",
  )[0] as HTMLDivElement;
  const backgroundSelect = document.getElementById(
    "background",
  ) as HTMLInputElement;
  const sloganToggle = document.getElementById("slogan") as HTMLInputElement;
  const slogan = document.querySelector(".motto");
  const svg = document.getElementById("image") as HTMLInputElement;
  const exportButton = document.getElementById("saveImage") as HTMLInputElement;

  const aspectRatioSelect = document.getElementById(
    "aspect-ratio",
  ) as HTMLInputElement;
  const motto = (svg as any).querySelector("svg");
  const canvasContainerFO = (svg as any).querySelector(
    "foreignObject:nth-of-type(1)",
  ) as SVGForeignObjectElement;
  const filenameContainerFO = (svg as any).querySelector(
    "foreignObject:nth-of-type(2)",
  ) as SVGForeignObjectElement;
  const eventName = (svg as any).querySelector(".event-name") as SVGTextElement;

  aspectRatioSelect.addEventListener("change", (event) => {
    const aspectRatio = (event.target as HTMLInputElement).value;

    switch (aspectRatio) {
      case "square":
        sloganToggle.disabled = true;
        svg.setAttribute("viewBox", "0 0 150 150");
        motto.style.display = "none";
        canvasContainerFO.setAttribute("x", "10");
        canvasContainerFO.setAttribute("y", "0");
        canvasContainerFO.setAttribute("width", "130");
        canvasContainerFO.setAttribute("height", "130");
        filenameContainerFO.setAttribute("x", "0");
        filenameContainerFO.setAttribute("y", "90");
        filenameContainerFO.setAttribute("width", "150");
        eventName.setAttribute("x", "75");
        eventName.setAttribute("y", "145");
        break;
      case "threeByFour":
        sloganToggle.disabled = false;
        svg.setAttribute("viewBox", "0 0 150 200");
        motto.style.display = sloganToggle.checked ? "block" : "none";
        motto.setAttribute("x", "23");
        motto.setAttribute("y", "20");
        canvasContainerFO.setAttribute("x", "0");
        canvasContainerFO.setAttribute("y", "35");
        canvasContainerFO.setAttribute("width", "150");
        canvasContainerFO.setAttribute("height", "250");
        filenameContainerFO.setAttribute("x", "5");
        filenameContainerFO.setAttribute("y", "140");
        filenameContainerFO.setAttribute("width", "140");
        eventName.setAttribute("x", "75");
        eventName.setAttribute("y", "190");
        break;
      case "din":
        sloganToggle.disabled = false;
        svg.setAttribute("viewBox", "0 0 150 212");
        motto.style.display = sloganToggle.checked ? "block" : "none";
        motto.setAttribute("x", "23");
        motto.setAttribute("y", "20");
        canvasContainerFO.setAttribute("x", "0");
        canvasContainerFO.setAttribute("y", "45");
        canvasContainerFO.setAttribute("width", "150");
        canvasContainerFO.setAttribute("height", "250");
        filenameContainerFO.setAttribute("x", "5");
        filenameContainerFO.setAttribute("y", "150");
        filenameContainerFO.setAttribute("width", "140");
        eventName.setAttribute("x", "75");
        eventName.setAttribute("y", "202");
        break;
      case "widescreen":
        sloganToggle.disabled = false;
        svg.setAttribute("viewBox", "0 0 250 150");
        motto.style.display = sloganToggle.checked ? "block" : "none";
        motto.setAttribute("x", "10");
        motto.setAttribute("y", "10");
        canvasContainerFO.setAttribute("x", "125");
        canvasContainerFO.setAttribute("y", "10");
        canvasContainerFO.setAttribute("width", "125");
        canvasContainerFO.setAttribute("height", "125");
        filenameContainerFO.setAttribute("x", "125");
        filenameContainerFO.setAttribute("y", "100");
        filenameContainerFO.setAttribute("width", "125");
        eventName.setAttribute("x", "62.5");
        eventName.setAttribute("y", "140");
        break;
    }
  });

  filenameDisplay.innerHTML = filenameInput.value;

  uploadInput.addEventListener("change", () => {
    const file = uploadInput.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          cropImage.src = e.target.result as string;
          cropModal.style.display = "flex";
          cropper = new Croppie(cropImage, {
            viewport: {
              width: 500,
              height: 500,
              type: "square",
            },
            enforceBoundary: true,
          });
        }
      };
      reader.readAsDataURL(file);
    }
  });

  filenameInput.addEventListener("keyup", (event) => {
    if (event.key === " ") filenameInput.value += " ";
    filenameDisplay.innerHTML = filenameInput.value;
  });

  sloganToggle.addEventListener("change", () => {
    if (sloganToggle.checked) {
      motto.style.display = "block";
    } else {
      motto.style.display = "none";
    }
  });

  backgroundSelect.addEventListener("change", (event) => {
    const color = (event.target as HTMLInputElement).value;

    if (color === "white") {
      svg.style.setProperty("--image-bg", "#fff");
      svg.style.setProperty("--text-color", "#000");
    } else if (color === "black") {
      svg.style.setProperty("--image-bg", "#000");
      svg.style.setProperty("--text-color", "#fff");
    }
  });

  cropButton.addEventListener("click", async () => {
    const croppedCanvas = await cropper.result({
      type: "rawcanvas",
      size: "original",
    });
    const image = croppedCanvas.toDataURL();
    new TextureLoader().load(image, (texture) => {
      texture.needsUpdate = true;
      uniforms.userImage.value = texture;
      if (userImage) {
        userImage.dispose();
      }
    });
    cropModal.style.display = "none";
    svg.style.setProperty("--image", `url(${image})`);
    cropper.destroy();
  });

  const dimensions: Record<string, { width: number; height: number }> = {
    square: { width: 2500, height: 2500 },
    threeByFour: { width: 2500, height: 3333 },
    din: { width: 2500, height: 3536 },
    widescreen: { width: 1920, height: 1080 },
  };

  exportButton.addEventListener("click", async () => {
    exportButton.disabled = true;
    const canvasContainer = document.querySelector(
      ".canvasContainer",
    ) as HTMLDivElement;
    const canvas = document.querySelector(
      ".canvasContainer canvas",
    ) as HTMLCanvasElement;
    const tempImage = canvas.toDataURL("image/png");
    canvasContainer.style.background = `url('${tempImage}') center`;
    canvasContainer.style.backgroundSize = "contain";
    const finalDimensions =
      dimensions[
        (aspectRatioSelect.querySelector("[checked]") as HTMLInputElement)
          .value ?? "din"
      ];
    console.log(svg);

    const snapdomCanvas = await snapdom.download(svg, {
      scale: finalDimensions.width / svg.getBoundingClientRect().width,
      embedFonts: true,
      reset: "hard",
      filename: `mrmcd_poster_${new Date().toLocaleString()}.png`,
    });
    canvasContainer.style.background = `none`;
    // canvasContainer.style.display = "block"
    exportButton.disabled = false;
  });

  const textureSets = [
    "book",
    "document",
    "engel",
    "folder",
    "image",
    "letter",
    "mastodon",
    "sheets",
    "video",
    "website",
  ];

  const textureSelect = document.getElementById(
    "texture-select",
  ) as HTMLSelectElement;

  textureSelect.innerHTML = "";
  textureSets.forEach((setName) => {
    const option = document.createElement("option");
    option.value = setName;
    option.text = setName;
    textureSelect.add(option);
  });

  textureSelect.addEventListener("change", (event) => {
    const setName = (event.target as HTMLSelectElement).value;
    new TextureLoader().load(`/uv_${setName}.png`, (texture) => {
      texture.needsUpdate = true;
      uniforms.uvMap.value = texture;
      if (uvMap) {
        uvMap.dispose();
      }
    });
    new TextureLoader().load(`/lighting_${setName}.png`, (texture) => {
      texture.needsUpdate = true;
      uniforms.lightingTexture.value = texture;
      if (lightingTexture) {
        lightingTexture.dispose();
      }
    });
  });

  const geometry = new PlaneGeometry(2, 2);
  const uniforms = {
    resolution: { value: new Vector2(width, height) },
    time: { value: 0.0 },
    uvMap: { value: uvMap },
    lightingTexture: { value: lightingTexture },
    userImage: { value: userImage },
  };
  const material = new ShaderMaterial({
    vertexShader: baseVert,
    fragmentShader: baseFrag,
    uniforms,
  });
  const mesh = new Mesh(geometry, material);
  scene.add(mesh);

  wrap.render = async ({ playhead }) => {
    renderer.render(scene, camera);
  };

  wrap.resize = ({ width, height }) => {
    uniforms["resolution"].value.set(width, height);
    renderer.setSize(width, height);
  };

  wrap.unload = () => {
    renderer.dispose();
    renderer.forceContextLoss();
  };
};

const settings: SketchSettings = {
  mode: "webgl2",
  dimensions: [2500, 2500],
  parent: ".canvasContainer",
  scaleToParent: false,
  attributes: {
    preserveDrawingBuffer: true,
  },
};

ssam(sketch, settings);
