import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { pdfText } = req.body || {};
    
    if (!pdfText) {
      return res.status(400).json({ error: 'pdfText is required' });
    }

    const openrouterApiKey = process.env.OPENROUTER_API_KEY;
    if (!openrouterApiKey) {
      return res.status(500).json({ error: 'OpenRouter API key not configured' });
    }

    const prompt = `Based on the following text from a PDF document, generate a title and subtitle in the style of "The Path of [Subject]" and "Experience [Document/Author] like never before. Select text to see live simulations."

PDF Text:
${pdfText}

Please analyze the content and respond with a JSON object containing:
{
  "title": "The Path of [extracted subject/topic]",
  "subtitle": "Experience [document name/author/topic] like never before. Select text to see live simulations."
}

Examples:
- For an electrodynamics textbook: {"title": "The Path of Electrodynamics", "subtitle": "Experience Griffiths' Introduction to Electrodynamics like never before. Select text to see live simulations."}
- For a machine learning paper: {"title": "The Path of Machine Learning", "subtitle": "Experience this ML research paper like never before. Select text to see live simulations."}
- For a quantum mechanics text: {"title": "The Path of Quantum Mechanics", "subtitle": "Experience quantum physics like never before. Select text to see live simulations."}

Extract the main subject/topic and create appropriate titles that follow this pattern.`;

    const openrouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://yourdomain.vercel.app',
        'X-Title': 'Electro Code Canvas'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!openrouterResponse.ok) {
      throw new Error(`OpenRouter API error: ${openrouterResponse.status}`);
    }

    const openrouterData = await openrouterResponse.json();
    const content = openrouterData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content received from OpenRouter');
    }

    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      result = {
        title: 'The Path of Knowledge',
        subtitle: 'Experience this document like never before. Select text to see live simulations.'
      };
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error('Title generation error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate titles',
      title: 'The Path of Knowledge',
      subtitle: 'Experience this document like never before. Select text to see live simulations.'
    });
  }
}