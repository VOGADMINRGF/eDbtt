import {
  getVoxyDetectorLicenseStatus,
  VOXY_VISUAL_DETECTOR_SELECTED,
  VOXY_VISUAL_HAND_MINIMUM_CONFIDENCE,
  type VoxyHandDetectionEvidence,
  type VoxyHandLandmarkEvidence,
} from "./visualDetectorLicenseContract";

export const VOXY_VISUAL_HAND_DETECTOR_PROFILE = {
  schemaVersion: 1,
  id: VOXY_VISUAL_DETECTOR_SELECTED.modelId,
  supportedPose: "upright_open_palm_flat_vector",
  minimumComponentAreaPixels: 180,
  minimumBoundingSidePixels: 24,
  neutralLightMinimumChannel: 170,
  neutralLightMaximumChannelSpread: 65,
  alphaMinimum: 200,
  fingerZoneFraction: 0.44,
  fingerColumnMinimumHeightFraction: 0.06,
  thumbZoneStartFraction: 0.42,
  thumbMinimumSideExtensionFraction: 0.1,
  minimumConfidence: VOXY_VISUAL_HAND_MINIMUM_CONFIDENCE,
} as const;

export const VOXY_VISUAL_HAND_DETECTOR_PROFILE_SERIALIZED = JSON.stringify(
  VOXY_VISUAL_HAND_DETECTOR_PROFILE,
);

export type VoxyVisualHandDetectorImage = {
  width: number;
  height: number;
  rgba: Uint8ClampedArray;
  inputPath: string;
  inputSha256: string;
};

export type VoxyVisualHandDetectorInput = {
  hand: "left" | "right";
  image: VoxyVisualHandDetectorImage;
};

type Pixel = { x: number; y: number };
type Component = {
  pixels: Pixel[];
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};
type FingerRun = { minX: number; maxX: number; tipY: number };

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

function emptyEvidence(input: {
  hand: "left" | "right";
  inputPath: string;
  inputSha256: string;
  modelSha256: string;
  failureReason: string;
}): VoxyHandDetectionEvidence {
  return {
    hand: input.hand,
    detected: false,
    handedness: null,
    landmarks: [],
    landmarkCount: 0,
    confidence: 0,
    fingerCount: null,
    detectorId: VOXY_VISUAL_DETECTOR_SELECTED.id,
    detectorVersion: VOXY_VISUAL_DETECTOR_SELECTED.version,
    runtimeVersion: VOXY_VISUAL_DETECTOR_SELECTED.runtimeVersion,
    modelId: VOXY_VISUAL_DETECTOR_SELECTED.modelId,
    modelSha256: input.modelSha256,
    inputSha256: input.inputSha256,
    inputPath: input.inputPath,
    localExecution: true,
    licenseStatus: getVoxyDetectorLicenseStatus(
      VOXY_VISUAL_DETECTOR_SELECTED.licenseMatrix,
    ),
    failureReason: input.failureReason,
  };
}

function buildNeutralLightMask(image: VoxyVisualHandDetectorImage): Uint8Array {
  const mask = new Uint8Array(image.width * image.height);
  for (let index = 0; index < mask.length; index += 1) {
    const offset = index * 4;
    const red = image.rgba[offset];
    const green = image.rgba[offset + 1];
    const blue = image.rgba[offset + 2];
    const alpha = image.rgba[offset + 3];
    const maximum = Math.max(red, green, blue);
    const minimum = Math.min(red, green, blue);
    if (
      alpha >= VOXY_VISUAL_HAND_DETECTOR_PROFILE.alphaMinimum &&
      minimum >= VOXY_VISUAL_HAND_DETECTOR_PROFILE.neutralLightMinimumChannel &&
      maximum - minimum <=
        VOXY_VISUAL_HAND_DETECTOR_PROFILE.neutralLightMaximumChannelSpread
    ) {
      mask[index] = 1;
    }
  }
  return mask;
}

function largestComponent(
  mask: Uint8Array,
  width: number,
  height: number,
): Component | null {
  const visited = new Uint8Array(mask.length);
  let largest: Component | null = null;

  for (let start = 0; start < mask.length; start += 1) {
    if (!mask[start] || visited[start]) continue;
    const queue = [start];
    visited[start] = 1;
    const pixels: Pixel[] = [];
    let minX = width;
    let maxX = 0;
    let minY = height;
    let maxY = 0;

    for (let queueIndex = 0; queueIndex < queue.length; queueIndex += 1) {
      const pixelIndex = queue[queueIndex];
      const x = pixelIndex % width;
      const y = (pixelIndex - x) / width;
      pixels.push({ x, y });
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);

      for (let deltaY = -1; deltaY <= 1; deltaY += 1) {
        for (let deltaX = -1; deltaX <= 1; deltaX += 1) {
          if (deltaX === 0 && deltaY === 0) continue;
          const nextX = x + deltaX;
          const nextY = y + deltaY;
          if (nextX < 0 || nextY < 0 || nextX >= width || nextY >= height) {
            continue;
          }
          const nextIndex = nextY * width + nextX;
          if (mask[nextIndex] && !visited[nextIndex]) {
            visited[nextIndex] = 1;
            queue.push(nextIndex);
          }
        }
      }
    }

    const component = { pixels, minX, maxX, minY, maxY };
    if (!largest || component.pixels.length > largest.pixels.length) {
      largest = component;
    }
  }

  return largest;
}

function findFingerRuns(
  component: Component,
  mask: Uint8Array,
  imageWidth: number,
): FingerRun[] {
  const componentHeight = component.maxY - component.minY + 1;
  const fingerZoneEnd = Math.floor(
    component.minY +
      componentHeight * VOXY_VISUAL_HAND_DETECTOR_PROFILE.fingerZoneFraction,
  );
  const minimumColumnHeight = Math.max(
    2,
    Math.floor(
      componentHeight *
        VOXY_VISUAL_HAND_DETECTOR_PROFILE.fingerColumnMinimumHeightFraction,
    ),
  );
  const occupiedColumns: boolean[] = [];

  for (let x = component.minX; x <= component.maxX; x += 1) {
    let count = 0;
    for (let y = component.minY; y <= fingerZoneEnd; y += 1) {
      if (mask[y * imageWidth + x]) count += 1;
    }
    occupiedColumns.push(count >= minimumColumnHeight);
  }

  const runs: FingerRun[] = [];
  let runStart: number | null = null;
  for (let offset = 0; offset <= occupiedColumns.length; offset += 1) {
    const occupied = occupiedColumns[offset] ?? false;
    if (occupied && runStart === null) {
      runStart = offset;
    } else if (!occupied && runStart !== null) {
      const minX = component.minX + runStart;
      const maxX = component.minX + offset - 1;
      if (maxX - minX + 1 >= 2) {
        let tipY = fingerZoneEnd;
        for (let x = minX; x <= maxX; x += 1) {
          for (let y = component.minY; y <= fingerZoneEnd; y += 1) {
            if (mask[y * imageWidth + x]) tipY = Math.min(tipY, y);
          }
        }
        runs.push({ minX, maxX, tipY });
      }
      runStart = null;
    }
  }
  return runs;
}

function findThumbTip(input: {
  hand: "left" | "right";
  component: Component;
  fingerRuns: FingerRun[];
}): Pixel | null {
  if (input.fingerRuns.length === 0) return null;
  const componentWidth = input.component.maxX - input.component.minX + 1;
  const componentHeight = input.component.maxY - input.component.minY + 1;
  const thumbZoneStart =
    input.component.minY +
    componentHeight * VOXY_VISUAL_HAND_DETECTOR_PROFILE.thumbZoneStartFraction;
  const minimumExtension =
    componentWidth *
    VOXY_VISUAL_HAND_DETECTOR_PROFILE.thumbMinimumSideExtensionFraction;
  const fingerMinX = Math.min(...input.fingerRuns.map((run) => run.minX));
  const fingerMaxX = Math.max(...input.fingerRuns.map((run) => run.maxX));
  const candidates = input.component.pixels.filter((pixel) => {
    if (pixel.y < thumbZoneStart) return false;
    return input.hand === "left"
      ? pixel.x <= fingerMinX - minimumExtension
      : pixel.x >= fingerMaxX + minimumExtension;
  });
  if (candidates.length === 0) return null;
  return candidates.reduce((best, candidate) => {
    if (input.hand === "left") {
      return candidate.x < best.x ? candidate : best;
    }
    return candidate.x > best.x ? candidate : best;
  });
}

function landmark(
  index: number,
  name: string,
  x: number,
  y: number,
  width: number,
  height: number,
  confidence: number,
): VoxyHandLandmarkEvidence {
  return {
    index,
    name,
    x: clamp01(x / Math.max(1, width - 1)),
    y: clamp01(y / Math.max(1, height - 1)),
    confidence,
  };
}

function buildLandmarks(input: {
  component: Component;
  fingerRuns: FingerRun[];
  thumbTip: Pixel;
  imageWidth: number;
  imageHeight: number;
  confidence: number;
}): VoxyHandLandmarkEvidence[] {
  const centerX = (input.component.minX + input.component.maxX) / 2;
  const palmBaseY = input.component.minY +
    (input.component.maxY - input.component.minY) * 0.68;
  const landmarks: VoxyHandLandmarkEvidence[] = [
    landmark(
      0,
      "wrist",
      centerX,
      input.component.maxY,
      input.imageWidth,
      input.imageHeight,
      input.confidence,
    ),
  ];
  const fingers = [
    {
      name: "thumb",
      tipX: input.thumbTip.x,
      tipY: input.thumbTip.y,
      baseX: centerX,
      baseY: palmBaseY,
    },
    ...input.fingerRuns.map((run, index) => ({
      name: `upright_finger_${index + 1}`,
      tipX: (run.minX + run.maxX) / 2,
      tipY: run.tipY,
      baseX: (run.minX + run.maxX) / 2,
      baseY: palmBaseY,
    })),
  ];
  for (const finger of fingers) {
    for (let joint = 1; joint <= 4; joint += 1) {
      const progress = joint / 4;
      landmarks.push(
        landmark(
          landmarks.length,
          `${finger.name}_${joint === 4 ? "tip" : `joint_${joint}`}`,
          finger.baseX + (finger.tipX - finger.baseX) * progress,
          finger.baseY + (finger.tipY - finger.baseY) * progress,
          input.imageWidth,
          input.imageHeight,
          input.confidence,
        ),
      );
    }
  }
  return landmarks;
}

export class VoxyVisualHandDetector {
  readonly modelSha256: string;

  constructor(input: { modelSha256: string }) {
    this.modelSha256 = input.modelSha256;
  }

  detect(input: VoxyVisualHandDetectorInput): VoxyHandDetectionEvidence {
    const { image, hand } = input;
    if (
      !Number.isInteger(image.width) ||
      !Number.isInteger(image.height) ||
      image.width <= 0 ||
      image.height <= 0 ||
      image.rgba.length !== image.width * image.height * 4
    ) {
      return emptyEvidence({
        hand,
        inputPath: image.inputPath,
        inputSha256: image.inputSha256,
        modelSha256: this.modelSha256,
        failureReason: "invalid_rgba_image",
      });
    }

    const mask = buildNeutralLightMask(image);
    const component = largestComponent(mask, image.width, image.height);
    if (
      !component ||
      component.pixels.length <
        VOXY_VISUAL_HAND_DETECTOR_PROFILE.minimumComponentAreaPixels
    ) {
      return emptyEvidence({
        hand,
        inputPath: image.inputPath,
        inputSha256: image.inputSha256,
        modelSha256: this.modelSha256,
        failureReason: "hand_component_not_detected",
      });
    }

    const componentWidth = component.maxX - component.minX + 1;
    const componentHeight = component.maxY - component.minY + 1;
    const touchesBoundary =
      component.minX <= 1 ||
      component.minY <= 1 ||
      component.maxX >= image.width - 2 ||
      component.maxY >= image.height - 2;
    const fingerRuns = findFingerRuns(component, mask, image.width);
    const thumbTip = findThumbTip({ hand, component, fingerRuns });
    const topologyConfident =
      fingerRuns.length >= 3 && fingerRuns.length <= 5 && thumbTip !== null;
    const resolutionScore = clamp01(
      Math.min(componentWidth, componentHeight) /
        VOXY_VISUAL_HAND_DETECTOR_PROFILE.minimumBoundingSidePixels,
    );
    const solidity =
      component.pixels.length / Math.max(1, componentWidth * componentHeight);
    const solidityScore = solidity >= 0.35 && solidity <= 0.85 ? 1 : 0.4;
    const confidence = clamp01(
      resolutionScore * 0.2 +
        (touchesBoundary ? 0 : 1) * 0.35 +
        (topologyConfident ? 1 : fingerRuns.length >= 2 ? 0.35 : 0) * 0.35 +
        solidityScore * 0.1,
    );
    const reliable =
      confidence >= VOXY_VISUAL_HAND_DETECTOR_PROFILE.minimumConfidence &&
      topologyConfident;
    const fingerCount = reliable ? fingerRuns.length + 1 : null;
    const landmarks =
      reliable && thumbTip
        ? buildLandmarks({
            component,
            fingerRuns,
            thumbTip,
            imageWidth: image.width,
            imageHeight: image.height,
            confidence,
          })
        : [];

    return {
      hand,
      detected: true,
      handedness: {
        label: hand,
        confidence,
        source: "capture_region_contract",
      },
      landmarks,
      landmarkCount: landmarks.length,
      confidence,
      fingerCount,
      detectorId: VOXY_VISUAL_DETECTOR_SELECTED.id,
      detectorVersion: VOXY_VISUAL_DETECTOR_SELECTED.version,
      runtimeVersion: VOXY_VISUAL_DETECTOR_SELECTED.runtimeVersion,
      modelId: VOXY_VISUAL_DETECTOR_SELECTED.modelId,
      modelSha256: this.modelSha256,
      inputSha256: image.inputSha256,
      inputPath: image.inputPath,
      localExecution: true,
      licenseStatus: getVoxyDetectorLicenseStatus(
        VOXY_VISUAL_DETECTOR_SELECTED.licenseMatrix,
      ),
      failureReason: reliable
        ? null
        : touchesBoundary
          ? "hand_component_touches_input_boundary"
          : "hand_topology_or_confidence_insufficient",
    };
  }
}
