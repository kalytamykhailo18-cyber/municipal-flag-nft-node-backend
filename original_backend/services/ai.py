"""
AI Image Generation Service using Replicate API.

Transforms Street View images into artistic flag-style images.
"""
import base64
import httpx
from typing import Optional
from config import settings


class AIGenerationError(Exception):
    """Raised when AI image generation fails."""
    pass


# Replicate model for image-to-image transformation
# Using stable-diffusion-img2img for style transfer
DEFAULT_MODEL = "stability-ai/stable-diffusion:ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4"

# Alternative models that can be used:
# - "stability-ai/sdxl": Latest Stable Diffusion XL
# - "cjwbw/rembg": For background removal
# - "tencentarc/photomaker": For style transfer

# Flag-style prompt for image transformation
FLAG_STYLE_PROMPT = """
Transform this image into an artistic municipal flag design.
Simplify the shapes, use bold colors, add heraldic elements.
Style: official flag, emblem, coat of arms, minimalist, vector art.
Keep key landmarks and symbols visible.
"""

FLAG_NEGATIVE_PROMPT = """
realistic photo, noisy, blurry, distorted, low quality,
watermark, text, signature, complex details
"""


async def transform_to_flag_style(
    image_bytes: bytes,
    prompt: Optional[str] = None,
    strength: float = 0.7,
    guidance_scale: float = 7.5,
    num_inference_steps: int = 50,
) -> bytes:
    """
    Transform an image into flag/emblem style using Replicate API.

    Args:
        image_bytes: Input image as bytes
        prompt: Custom style prompt (uses default if None)
        strength: How much to transform (0.0 = keep original, 1.0 = full transformation)
        guidance_scale: How closely to follow the prompt (higher = more prompt influence)
        num_inference_steps: Number of denoising steps (more = better quality, slower)

    Returns:
        bytes: Transformed image as bytes

    Raises:
        AIGenerationError: If transformation fails
    """
    # Check API token
    if not settings.replicate_api_token:
        raise AIGenerationError(
            "Replicate API token not configured. "
            "Set REPLICATE_API_TOKEN environment variable."
        )

    # Use default prompt if none provided
    style_prompt = prompt or FLAG_STYLE_PROMPT

    # Encode image to base64 for API
    image_base64 = base64.b64encode(image_bytes).decode("utf-8")
    image_data_uri = f"data:image/jpeg;base64,{image_base64}"

    # Replicate API endpoint
    url = "https://api.replicate.com/v1/predictions"

    headers = {
        "Authorization": f"Token {settings.replicate_api_token}",
        "Content-Type": "application/json",
    }

    # Request payload for img2img transformation
    payload = {
        "version": DEFAULT_MODEL.split(":")[-1],
        "input": {
            "image": image_data_uri,
            "prompt": style_prompt,
            "negative_prompt": FLAG_NEGATIVE_PROMPT,
            "prompt_strength": strength,
            "guidance_scale": guidance_scale,
            "num_inference_steps": num_inference_steps,
            "width": settings.sd_image_width,
            "height": settings.sd_image_height,
        }
    }

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            # Create prediction
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()

            prediction = response.json()
            prediction_id = prediction.get("id")

            if not prediction_id:
                raise AIGenerationError("Failed to create prediction: No ID returned")

            # Poll for completion
            poll_url = f"{url}/{prediction_id}"
            max_attempts = 60  # Max 5 minutes (60 * 5 seconds)

            for _ in range(max_attempts):
                poll_response = await client.get(poll_url, headers=headers)
                poll_response.raise_for_status()

                result = poll_response.json()
                status = result.get("status")

                if status == "succeeded":
                    # Get the output image URL
                    output = result.get("output")
                    if isinstance(output, list) and len(output) > 0:
                        image_url = output[0]
                    elif isinstance(output, str):
                        image_url = output
                    else:
                        raise AIGenerationError("No output image in prediction result")

                    # Download the generated image
                    image_response = await client.get(image_url)
                    image_response.raise_for_status()
                    return image_response.content

                elif status == "failed":
                    error = result.get("error", "Unknown error")
                    raise AIGenerationError(f"Prediction failed: {error}")

                elif status in ("starting", "processing"):
                    # Wait before polling again
                    import asyncio
                    await asyncio.sleep(5)
                else:
                    raise AIGenerationError(f"Unknown prediction status: {status}")

            raise AIGenerationError("Prediction timed out after 5 minutes")

    except httpx.HTTPStatusError as e:
        error_detail = ""
        try:
            error_detail = e.response.json().get("detail", "")
        except Exception:
            pass
        raise AIGenerationError(f"HTTP error from Replicate: {e.response.status_code} - {error_detail}")
    except httpx.RequestError as e:
        raise AIGenerationError(f"Network error connecting to Replicate: {str(e)}")


async def generate_flag_from_text(
    prompt: str,
    negative_prompt: Optional[str] = None,
    width: int = 512,
    height: int = 512,
) -> bytes:
    """
    Generate a flag image from a text prompt (no input image).

    Args:
        prompt: Description of the flag to generate
        negative_prompt: What to avoid in the generation
        width: Output image width
        height: Output image height

    Returns:
        bytes: Generated image as bytes
    """
    if not settings.replicate_api_token:
        raise AIGenerationError("Replicate API token not configured")

    # Text-to-image model
    txt2img_model = "stability-ai/stable-diffusion:ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4"

    url = "https://api.replicate.com/v1/predictions"

    headers = {
        "Authorization": f"Token {settings.replicate_api_token}",
        "Content-Type": "application/json",
    }

    payload = {
        "version": txt2img_model.split(":")[-1],
        "input": {
            "prompt": f"Municipal flag design: {prompt}. Style: official flag, emblem, heraldic, vector art",
            "negative_prompt": negative_prompt or FLAG_NEGATIVE_PROMPT,
            "width": width,
            "height": height,
            "num_inference_steps": 50,
            "guidance_scale": 7.5,
        }
    }

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()

            prediction = response.json()
            prediction_id = prediction.get("id")

            if not prediction_id:
                raise AIGenerationError("Failed to create prediction")

            # Poll for completion
            poll_url = f"{url}/{prediction_id}"

            for _ in range(60):
                poll_response = await client.get(poll_url, headers=headers)
                poll_response.raise_for_status()

                result = poll_response.json()
                status = result.get("status")

                if status == "succeeded":
                    output = result.get("output")
                    if isinstance(output, list) and len(output) > 0:
                        image_url = output[0]
                    elif isinstance(output, str):
                        image_url = output
                    else:
                        raise AIGenerationError("No output image")

                    image_response = await client.get(image_url)
                    image_response.raise_for_status()
                    return image_response.content

                elif status == "failed":
                    raise AIGenerationError(f"Generation failed: {result.get('error')}")

                import asyncio
                await asyncio.sleep(5)

            raise AIGenerationError("Generation timed out")

    except httpx.HTTPStatusError as e:
        raise AIGenerationError(f"HTTP error: {e.response.status_code}")
    except httpx.RequestError as e:
        raise AIGenerationError(f"Network error: {str(e)}")
