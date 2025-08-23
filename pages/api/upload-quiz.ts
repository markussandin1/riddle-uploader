import type { NextApiRequest, NextApiResponse } from 'next';

type ResponseData = {
  success: boolean;
  message: string;
  data?: any;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { quizData } = req.body;

  if (!quizData) {
    return res.status(400).json({ 
      success: false, 
      message: 'Ingen quiz data skickad' 
    });
  }

  // Validate API key from environment
  const apiKey = process.env.RIDDLE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ 
      success: false, 
      message: 'Server configuration error: API key missing' 
    });
  }

  try {
    // Parse and validate JSON
    let parsedQuizData;
    try {
      parsedQuizData = typeof quizData === 'string' ? JSON.parse(quizData) : quizData;
    } catch (error) {
      return res.status(400).json({ 
        success: false, 
        message: 'Ogiltig JSON format' 
      });
    }

    // Basic validation of quiz structure
    if (!parsedQuizData.type || !parsedQuizData.build) {
      return res.status(400).json({ 
        success: false, 
        message: 'Quiz JSON saknar required fields: type och build' 
      });
    }

    if (!parsedQuizData.build.title || !parsedQuizData.build.blocks) {
      return res.status(400).json({ 
        success: false, 
        message: 'Quiz build saknar required fields: title och blocks' 
      });
    }

    if (!Array.isArray(parsedQuizData.build.blocks) || parsedQuizData.build.blocks.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Quiz måste ha minst en fråga (block)' 
      });
    }

    console.log('Posting quiz to Riddle:', parsedQuizData.build.title);

    // Post to Riddle API
    const response = await fetch('https://www.riddle.com/creator/api/v3/riddle-builder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(parsedQuizData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Riddle API error: ${response.status}`;
      
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.message) {
          errorMessage = errorData.message;
        }
        if (errorData.validationErrors && Array.isArray(errorData.validationErrors)) {
          const validationMessages = errorData.validationErrors.map((err: any) => 
            `${err.property}: ${err.message}`
          ).join(', ');
          errorMessage += ` - Validation: ${validationMessages}`;
        }
      } catch (e) {
        // If we can't parse error as JSON, use the raw text
        errorMessage += `: ${errorText.substring(0, 200)}`;
      }

      return res.status(response.status).json({
        success: false,
        message: errorMessage,
      });
    }

    const result = await response.json();

    if (result.success && result.data) {
      return res.status(200).json({
        success: true,
        message: `Quiz "${result.data.title}" skapades framgångsrikt!`,
        data: {
          UUID: result.data.UUID || result.data.uniqid,
          title: result.data.title,
          type: result.data.type,
          created: result.data.created,
          published: result.data.published ? true : false,
          image: result.data.image,
        },
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Oväntat svar från Riddle API',
      });
    }
  } catch (error) {
    console.error('Error posting quiz:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error: ' + (error as Error).message,
    });
  }
}