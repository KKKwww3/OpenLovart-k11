import { NextRequest, NextResponse } from 'next/server';

const MODEL_ALIAS_MAP: Record<string, string> = {
    'nano-banana': 'google/gemini-3.1-flash-image-preview',
    'nano-banana-pro': 'openai/gpt-5.4-image-2',
};

const DEFAULT_MODEL_ALIAS = 'nano-banana';

export async function POST(request: NextRequest) {
    try {
        const { prompt, resolution, aspectRatio, referenceImage, mimeType, model: modelAlias } = await request.json();

        if (!prompt || typeof prompt !== 'string') {
            return NextResponse.json(
                { error: 'Prompt is required' },
                { status: 400 }
            );
        }

        const apiBaseUrl = process.env.IMAGE_API_BASE_URL || 'https://router-us.xavierwork.eu.cc/api/v1';
        const apiKey = process.env.IMAGE_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: 'IMAGE_API_KEY not configured' },
                { status: 500 }
            );
        }

        const actualModel = MODEL_ALIAS_MAP[modelAlias] || MODEL_ALIAS_MAP[DEFAULT_MODEL_ALIAS];

        console.log('Starting image generation:', actualModel, 'alias:', modelAlias || DEFAULT_MODEL_ALIAS);

        const userContent: any[] = [
            { type: 'text', text: prompt },
        ];

        if (referenceImage) {
            let cleanData = referenceImage;
            let finalMimeType = mimeType || 'image/jpeg';

            if (referenceImage.includes('base64,')) {
                const matches = referenceImage.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
                if (matches) {
                    finalMimeType = matches[1];
                    cleanData = matches[2];
                } else {
                    const parts = referenceImage.split('base64,');
                    if (parts.length > 1) {
                        cleanData = parts[1];
                    }
                }
            }

            userContent.push({
                type: 'image_url',
                image_url: {
                    url: `data:${finalMimeType};base64,${cleanData}`,
                },
            });
        }

        const messages = [
            { role: 'user', content: userContent },
        ];

        console.log('Calling image API with model:', actualModel);

        const response = await fetch(`${apiBaseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: actualModel,
                messages,
                modalities: ['image'],
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Image API error:', response.status, errorText);
            return NextResponse.json(
                { error: 'Image generation failed', details: `API responded with status ${response.status}` },
                { status: 502 }
            );
        }

        const result = await response.json();

        console.log('Image API response received');

        let imageData: string | null = null;
        let textResponse = '';

        const choice = result.choices?.[0];
        const message = choice?.message;

        if (message) {
            if (typeof message.content === 'string') {
                textResponse = message.content;
            } else if (Array.isArray(message.content)) {
                for (const part of message.content) {
                    if (part.type === 'image_url' && part.image_url?.url) {
                        imageData = part.image_url.url;
                    } else if (part.type === 'image' && part.image_url?.url) {
                        imageData = part.image_url.url;
                    } else if (part.type === 'text') {
                        textResponse += part.text || '';
                    } else if (part.inlineData) {
                        imageData = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
                    }
                }
            }

            if (message.images && Array.isArray(message.images)) {
                for (const img of message.images) {
                    if (img.url && !imageData) {
                        imageData = img.url;
                    }
                    if (img.image_url?.url && !imageData) {
                        imageData = img.image_url.url;
                    }
                }
            }
        }

        if (!imageData && textResponse) {
            const base64Match = textResponse.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/);
            if (base64Match) {
                imageData = base64Match[0];
                textResponse = textResponse.replace(base64Match[0], '').trim();
            }
        }

        if (!imageData) {
            if (textResponse) {
                return NextResponse.json({
                    error: 'Model returned text instead of image',
                    details: textResponse,
                }, { status: 500 });
            }

            return NextResponse.json(
                {
                    error: 'No image was generated',
                    details: 'No image data found in response.',
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            imageData,
            textResponse,
        });

    } catch (error: any) {
        console.error('Error generating image:', error);
        return NextResponse.json(
            {
                error: 'Failed to generate image',
                details: error.message || 'Unknown error',
            },
            { status: 500 }
        );
    }
}
