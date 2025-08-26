import { ssam } from "ssam";
import type { Sketch, SketchSettings } from "ssam";
import {
  PlaneGeometry,
  Mesh,
  OrthographicCamera,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  TextureLoader,
  Vector2,
  WebGLRenderer,
} from "three";
import {saveAs} from "file-saver"
import baseVert from "./shaders/base.vert";
import baseFrag from "./shaders/base.frag";
import { snapdom } from "@zumer/snapdom";

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

  const renderer = new WebGLRenderer({ canvas, "antialias": true, "alpha": true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(pixelRatio);

  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const scene = new Scene();

  const uvMap = new TextureLoader().load("/uv_book.png") 
  const lightingTexture = new TextureLoader().load("/lighting_book.png") 
  const userImage = new TextureLoader().load("/placeholder.jpg") 

  const uploadInput = document.getElementById("upload") as HTMLInputElement;
  const cropModal = document.getElementById("crop-modal") as HTMLDivElement;
  const cropImage = document.getElementById("crop-image") as HTMLImageElement;
  const cropButton = document.getElementById("crop-button") as HTMLButtonElement;
  let cropper: any;
  const filenameInput = document.getElementById("filename") as HTMLInputElement;
  const filenameDisplay = document.getElementsByClassName("filename")[0] as HTMLDivElement;
  const backgroundSelect = document.getElementById("background") as HTMLInputElement;
  const sloganToggle = document.getElementById("slogan") as HTMLInputElement;
  const slogan = document.querySelector(".motto")
  const svg = document.getElementById("image") as HTMLInputElement;
  const exportButton = document.getElementById("saveImage") as HTMLInputElement;

  filenameDisplay.innerHTML = filenameInput.value

  uploadInput.addEventListener("change", (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          cropImage.src = e.target.result as string;
          cropModal.style.display = "flex";
          cropper = new Cropper(cropImage, {
            aspectRatio: 1,
            viewMode: 1,
          });
        }
      };
      reader.readAsDataURL(file);
    }
  });

  filenameInput.addEventListener("keyup", (event) => {
    if (event.key === " ") filenameInput.value += " "
    filenameDisplay.innerHTML = filenameInput.value
  })


  sloganToggle.addEventListener("change", (event) => {
    if(event.target.checked) {
      slogan.style.display = "block"
    } else {
      slogan.style.display = "none"
    }
  })

  backgroundSelect.addEventListener("change", (event) => {
    if(event.target.value === "white") {
      svg.style.setProperty("--image-bg", "#fff")
      svg.style.setProperty("--text-color", "#000")
    } else if(event.target.value === "black") {
      svg.style.setProperty("--image-bg", "#000")
      svg.style.setProperty("--text-color", "#fff")
    }
  })

  cropButton.addEventListener("click", () => {
    const croppedCanvas = cropper.getCroppedCanvas();
    const image = croppedCanvas.toDataURL();
    svg.style.setProperty("--image", `url('${image}'`)
    const newTexture = new TextureLoader().load(image, (texture) => {
      texture.needsUpdate = true;
      uniforms.userImage.value = texture;
      if (userImage) {
        userImage.dispose();
      }
    });
    cropModal.style.display = "none";
    cropper.destroy();
  });

  exportButton.addEventListener("click", async () => {
    exportButton.disabled = true;
    const canvasContainer = document.querySelector(".canvasContainer") as HTMLCanvasElement
    const canvas = document.querySelector(".canvasContainer canvas") as HTMLCanvasElement
    const tempImage = canvas.toDataURL("image/png")
    canvasContainer.style.background = `url('${tempImage}') center`
    canvasContainer.style.backgroundSize = "contain"
    const blob = await snapdom.toCanvas(svg, { embedFonts: true, width: 2500 });
    saveAs(blob.toDataURL("image/png"), `mrmcd_poster_${(new Date()).toLocaleString()}`)
    canvasContainer.style.background = `none`
    // canvasContainer.style.display = "block"
    exportButton.disabled = false;
  })

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

  const textureSelect = document.getElementById("texture-select") as HTMLSelectElement;

  textureSelect.innerHTML = ""
  textureSets.forEach(setName => {
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
    uvMap: { value:  uvMap},
    lightingTexture: { value:  lightingTexture},
    userImage: { value:  userImage},
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
