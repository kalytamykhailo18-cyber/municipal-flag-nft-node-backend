/**
 * AI Image Generation Service using Replicate API
 *
 * Transforms images into artistic flag-style images.
 */
const axios = require('axios');
const config = require('../config');

// Replicate model for image-to-image transformation
const DEFAULT_MODEL =
  'stability-ai/stable-diffusion:ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4';

// Flag-style prompt for image transformation
const FLAG_STYLE_PROMPT = `
Transform this image into an artistic municipal flag design.
Simplify the shapes, use bold colors, add heraldic elements.
Style: official flag, emblem, coat of arms, minimalist, vector art.
Keep key landmarks and symbols visible.
`;

const FLAG_NEGATIVE_PROMPT = `
realistic photo, noisy, blurry, distorted, low quality,
watermark, text, signature, complex details
`;

class AIGenerationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AIGenerationError';
  }
}

/**
 * Wait for a specified number of milliseconds
 * @param {number} ms - Milliseconds to wait
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Transform an image into flag/emblem style using Replicate API
 * @param {Object} params - Transformation parameters
 * @param {Buffer} params.imageBytes - Input image as buffer
 * @param {string} params.prompt - Custom style prompt (uses default if not provided)
 * @param {number} params.strength - How much to transform (0.0-1.0)
 * @param {number} params.guidanceScale - How closely to follow the prompt
 * @param {number} params.numInferenceSteps - Number of denoising steps
 * @returns {Promise<Buffer>} Transformed image as buffer
 */
const transformToFlagStyle = async ({
  imageBytes,
  prompt = null,
  strength = 0.7,
  guidanceScale = 7.5,
  numInferenceSteps = 50,
}) => {
  if (!config.ai.replicateApiToken) {
    throw new AIGenerationError(
      'Replicate API token not configured. Set REPLICATE_API_TOKEN environment variable.'
    );
  }

  const stylePrompt = prompt || FLAG_STYLE_PROMPT;

  // Encode image to base64
  const imageBase64 = imageBytes.toString('base64');
  const imageDataUri = `data:image/jpeg;base64,${imageBase64}`;

  const url = 'https://api.replicate.com/v1/predictions';

  const headers = {
    Authorization: `Token ${config.ai.replicateApiToken}`,
    'Content-Type': 'application/json',
  };

  const payload = {
    version: DEFAULT_MODEL.split(':')[1],
    input: {
      image: imageDataUri,
      prompt: stylePrompt,
      negative_prompt: FLAG_NEGATIVE_PROMPT,
      prompt_strength: strength,
      guidance_scale: guidanceScale,
      num_inference_steps: numInferenceSteps,
      width: config.ai.sdImageWidth,
      height: config.ai.sdImageHeight,
    },
  };

  try {
    // Create prediction
    const response = await axios.post(url, payload, {
      headers,
      timeout: 120000,
    });

    const predictionId = response.data.id;

    if (!predictionId) {
      throw new AIGenerationError('Failed to create prediction: No ID returned');
    }

    // Poll for completion
    const pollUrl = `${url}/${predictionId}`;
    const maxAttempts = 60; // Max 5 minutes (60 * 5 seconds)

    for (let i = 0; i < maxAttempts; i++) {
      const pollResponse = await axios.get(pollUrl, { headers });
      const result = pollResponse.data;
      const status = result.status;

      if (status === 'succeeded') {
        const output = result.output;
        let imageUrl;

        if (Array.isArray(output) && output.length > 0) {
          imageUrl = output[0];
        } else if (typeof output === 'string') {
          imageUrl = output;
        } else {
          throw new AIGenerationError('No output image in prediction result');
        }

        // Download the generated image
        const imageResponse = await axios.get(imageUrl, {
          responseType: 'arraybuffer',
        });

        return Buffer.from(imageResponse.data);
      } else if (status === 'failed') {
        throw new AIGenerationError(`Prediction failed: ${result.error || 'Unknown error'}`);
      } else if (status === 'starting' || status === 'processing') {
        await sleep(5000);
      } else {
        throw new AIGenerationError(`Unknown prediction status: ${status}`);
      }
    }

    throw new AIGenerationError('Prediction timed out after 5 minutes');
  } catch (error) {
    if (error.name === 'AIGenerationError') {
      throw error;
    }
    if (error.response) {
      const errorDetail = error.response.data?.detail || '';
      throw new AIGenerationError(
        `HTTP error from Replicate: ${error.response.status} - ${errorDetail}`
      );
    }
    throw new AIGenerationError(`Network error connecting to Replicate: ${error.message}`);
  }
};

/**
 * Generate a flag image from a text prompt (no input image)
 * @param {Object} params - Generation parameters
 * @param {string} params.prompt - Description of the flag to generate
 * @param {string} params.negativePrompt - What to avoid in the generation
 * @param {number} params.width - Output image width
 * @param {number} params.height - Output image height
 * @returns {Promise<Buffer>} Generated image as buffer
 */
const generateFlagFromText = async ({
  prompt,
  negativePrompt = null,
  width = 512,
  height = 512,
}) => {
  if (!config.ai.replicateApiToken) {
    throw new AIGenerationError('Replicate API token not configured');
  }

  const txt2imgModel =
    'stability-ai/stable-diffusion:ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4';

  const url = 'https://api.replicate.com/v1/predictions';

  const headers = {
    Authorization: `Token ${config.ai.replicateApiToken}`,
    'Content-Type': 'application/json',
  };

  const payload = {
    version: txt2imgModel.split(':')[1],
    input: {
      prompt: `Municipal flag design: ${prompt}. Style: official flag, emblem, heraldic, vector art`,
      negative_prompt: negativePrompt || FLAG_NEGATIVE_PROMPT,
      width,
      height,
      num_inference_steps: 50,
      guidance_scale: 7.5,
    },
  };

  try {
    const response = await axios.post(url, payload, {
      headers,
      timeout: 120000,
    });

    const predictionId = response.data.id;

    if (!predictionId) {
      throw new AIGenerationError('Failed to create prediction');
    }

    const pollUrl = `${url}/${predictionId}`;

    for (let i = 0; i < 60; i++) {
      const pollResponse = await axios.get(pollUrl, { headers });
      const result = pollResponse.data;
      const status = result.status;

      if (status === 'succeeded') {
        const output = result.output;
        let imageUrl;

        if (Array.isArray(output) && output.length > 0) {
          imageUrl = output[0];
        } else if (typeof output === 'string') {
          imageUrl = output;
        } else {
          throw new AIGenerationError('No output image');
        }

        const imageResponse = await axios.get(imageUrl, {
          responseType: 'arraybuffer',
        });

        return Buffer.from(imageResponse.data);
      } else if (status === 'failed') {
        throw new AIGenerationError(`Generation failed: ${result.error}`);
      }

      await sleep(5000);
    }

    throw new AIGenerationError('Generation timed out');
  } catch (error) {
    if (error.name === 'AIGenerationError') {
      throw error;
    }
    if (error.response) {
      throw new AIGenerationError(`HTTP error: ${error.response.status}`);
    }
    throw new AIGenerationError(`Network error: ${error.message}`);
  }
};

module.exports = {
  AIGenerationError,
  transformToFlagStyle,
  generateFlagFromText,
};
