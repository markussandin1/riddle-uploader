import type { NextApiRequest, NextApiResponse } from 'next';

interface RiddleQuizData {
  type: string;
  publish: boolean;
  build: {
    title: string;
    blocks: any[];
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed. Use POST.' 
    });
  }

  try {
    // Expect direct quiz JSON in request body
    const quizData: RiddleQuizData = req.body;
    
    // Basic validation
    if (!quizData || typeof quizData !== 'object') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid JSON format' 
      });
    }

    if (!quizData.type || !quizData.build) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: type, build' 
      });
    }

    if (!quizData.build.title) {
      return res.status(400).json({ 
        success: false, 
        message: 'Quiz title is required in build.title' 
      });
    }

    if (!quizData.build.blocks || !Array.isArray(quizData.build.blocks) || quizData.build.blocks.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Quiz must have at least one question block' 
      });
    }

    // Get API key from environment
    const apiKey = process.env.RIDDLE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        success: false, 
        message: 'API key not configured' 
      });
    }

    // Post to Riddle API
    const riddleResponse = await fetch('https://www.riddle.com/creator/api/v3/riddle-builder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(quizData)
    });

    if (!riddleResponse.ok) {
      const errorText = await riddleResponse.text();
      console.error('Riddle API error:', riddleResponse.status, errorText);
      return res.status(400).json({ 
        success: false, 
        message: `Riddle API error: ${riddleResponse.status} - ${errorText}` 
      });
    }

    const result = await riddleResponse.json();
    
    return res.status(200).json({
      success: true,
      message: 'Quiz uploaded to Riddle successfully!',
      data: {
        UUID: result.UUID,
        title: result.title,
        created: result.created,
        published: result.published,
        viewUrl: result.published ? `https://www.riddle.com/view/${result.UUID}` : null
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error: ' + (error as Error).message 
    });
  }
}