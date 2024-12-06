const XAI_API_KEY = 'xai-xczxSaFRmQAJb6HOEHAxlfUUCG9JIotBwwp8OR4CNhXPGSZW5VQSyz0yGB7bLbkkxK8zgYLKB0cfSwX9';
const XAI_API_URL = 'https://api.x.ai/v1/chat/completions';
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

export async function analyzeImage(imageFile: File): Promise<string> {
  try {
    // Validate file type
    if (!imageFile.type.startsWith('image/')) {
      throw new Error('Please upload an image file (JPEG, PNG)');
    }

    // Validate file size
    if (imageFile.size > MAX_IMAGE_SIZE) {
      throw new Error('Image size must be less than 10MB');
    }

    // Convert image to base64
    const base64Image = await fileToBase64(imageFile);

    // Validate base64 string length (xAI might have a limit)
    if (base64Image.length > 20 * 1024 * 1024) { // 20MB limit for base64
      throw new Error('Image is too large after conversion. Please use a smaller image.');
    }

    const payload = {
      messages: [
        {
          role: "system",
          content: `You are an expert medical report analyzer. You will receive medical report images and provide detailed analysis including key findings, measurements, and recommendations.
          Format your response using markdown syntax for better readability.
          Use appropriate formatting like bold for important values, tables for test results, and proper headings.
          If the image is not a medical report, kindly inform that the image appears to be something else.`
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${imageFile.type};base64,${base64Image}`
              }
            },
            {
              type: "text",
              text: "Please analyze this medical report image and provide a detailed summary. If this is not a medical report, please let me know."
            }
          ]
        }
      ],
      model: "grok-vision-beta",
      stream: false,
      temperature: 0.2,
      max_tokens: 2500
    };

    console.log('Sending request to xAI API...');
    
    const response = await fetch(XAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${XAI_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Response:', errorText);
      
      // Handle specific error codes
      switch (response.status) {
        case 412:
          throw new Error('The image format is not supported or the image is corrupted. Please try a different image.');
        case 413:
          throw new Error('The image is too large. Please use a smaller image.');
        case 429:
          throw new Error('Too many requests. Please try again in a few moments.');
        case 401:
          throw new Error('API authentication failed. Please check your API key.');
        default:
          throw new Error(`API request failed: ${response.status} - Please try a different image or try again later.`);
      }
    }

    const data = await response.json();
    console.log('API Response:', data);

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from API');
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error analyzing image:', error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('An unexpected error occurred while analyzing the image');
  }
}

// Helper function to convert File to base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = error => reject(error);
  });
} 