import { fal } from "@fal-ai/client";

fal.config({ credentials: process.env.FAL_KEY });

const PROMPTS: Record<"upper" | "lower" | "overall", string> = {
  upper: `Photorealistic virtual try-on. Two input images are provided: the FIRST image is a real photograph of a person; the SECOND image shows a clothing item (top, shirt, blouse, jacket, or sweatshirt). Task: generate a single photorealistic output image of the person wearing the garment from the second image on their upper body. Critical requirements — preserve exactly as-is: the person's face, skin tone, facial features, hair, lower body clothing, shoes, body proportions, body pose, and background. Render the garment with its exact original colors, patterns, prints, fabric texture, and fit silhouette from the second image. Match the lighting direction, shadow quality, and overall image tonality of the first photograph. The final image must be indistinguishable from a real photograph — no cartoon rendering, no blending artifacts, no distortion of body shape.`,

  lower: `Photorealistic virtual try-on. Two input images are provided: the FIRST image is a real photograph of a person; the SECOND image shows a clothing item (pants, jeans, trousers, skirt, shorts, leggings, or palazzos). Task: generate a single photorealistic output image of the person wearing the garment from the second image on their lower body. Critical requirements — preserve exactly as-is: the person's face, skin tone, facial features, hair, upper body clothing, body proportions, body pose, and background. Render the garment with its exact original colors, patterns, prints, fabric texture, and fit silhouette from the second image. Match the lighting direction, shadow quality, and overall image tonality of the first photograph. The final image must be indistinguishable from a real photograph — no cartoon rendering, no blending artifacts, no distortion of body shape.`,

  overall: `Photorealistic virtual try-on. Two input images are provided: the FIRST image is a real photograph of a person; the SECOND image shows a complete outfit (dress, ethnic suit, saree, co-ord set, or jumpsuit). Task: generate a single photorealistic output image of the person wearing the complete outfit from the second image. Critical requirements — preserve exactly as-is: the person's face, skin tone, facial features, hair, body proportions, body pose, and background. Render the outfit with its exact original colors, patterns, prints, fabric texture, drape, and fit silhouette from the second image. Match the lighting direction, shadow quality, and overall image tonality of the first photograph. The final image must be indistinguishable from a real photograph — no cartoon rendering, no blending artifacts, no distortion of body shape.`,
};

export async function runVTON(input: {
  human_image_url: string;
  garment_image_url: string;
  cloth_type: "upper" | "lower" | "overall";
}): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await fal.subscribe("fal-ai/nano-banana-2/edit", {
    input: {
      prompt: PROMPTS[input.cloth_type],
      image_urls: [input.human_image_url, input.garment_image_url],
    },
    logs: false,
    onQueueUpdate: () => {},
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;

  return result.data.images[0].url as string;
}

export function mapVtonCategory(
  category: "upper" | "lower" | "one-pieces"
): "upper" | "lower" | "overall" {
  if (category === "one-pieces") return "overall";
  return category;
}
