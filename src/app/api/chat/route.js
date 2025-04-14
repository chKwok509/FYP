"use server";
import { Ollama } from "ollama";

import {get_best} from "./get_diet"

export async function POST(request) {
  const ollama = new Ollama({ host: "http://172.20.16.1:11434/" }); 
  try {
    const { message,user,context=[],user_features} = await request.json();
    
    let diets= await get_best(user_features);

    let diet_prompt = `## Recommendedation \n\nYou have a list of recommendedations tailored to the user: ${diets}. \
                      Incorporate those with Diet: tags into your responses when the user asks about nutrition or diet plans. \
                      Incorporate those with Exercises: , Equiments: or Fitness Type: tags into your responses when the user asks about exercise plans.\
                      Explain why each recommendation suits the user's needs based on their features, using bullet points for clarity.\n `;    
    
    let context_prompt = `## Conversation Context\n\nYou have access to previous responses: ${context}. Reference them only if relevant to the user's current query to maintain continuity. List any referenced context briefly in a bullet point before answering.\n`;    
        
    const constraints = `# Fitness Advisor Chatbot Constraints\n\nYou are a fitness advisor chatbot. Follow these guidelines:\n- Respond in clear, friendly English.\n- Personalize advice based on the user's features and query.\n- Stay concise, professional, and focused on fitness, nutrition, or exercise.\n- Use markdown formatting for all responses.\n- Structure responses with clear headings and bullet points where applicable.\n`;
    let prompt = constraints + diet_prompt;
    
    if (context.length > 0) {
      prompt += context_prompt;
    }

    const stream = await ollama.chat({
      model: "deepseek-r1:7b-qwen-distill-q4_K_M",
      messages: [ 
                  { role: "system", content: prompt},
                  { role: "user", content: message }

                ],
      stream: true,
    });
    
    let endThink=false,think="",output="";

    return new Response(
      new ReadableStream({

        async start(controller) {
          const encoder = new TextEncoder();
          try {
            for await (const chunk of stream) {
              // Each chunk is an object with a 'message' property containing 'content'
              let content = chunk.message.content;
              if (content.includes("</think>")) {endThink=true;continue;}
              if(endThink){
                controller.enqueue(encoder.encode(content));
                output+=content;
              }
              else{
                think+=content;
              }
              
            }
            controller.close();
          } catch (error) {
            controller.error(error);
          } finally{
            //console.log("received features: ", test);
            console.log(`Best ${diets.length} diet for user ${user}:\n`+diets);
            //console.log(`Best ${exercises.length} exercise for user ${user}:\n`+exercises);
            console.log("Think block:" + think.replace("<think>",""));
            //console.log("Output:" + output);
          }
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "text/plain",
          "Transfer-Encoding": "chunked",
        },
      }
    );
  } catch (error) {
    console.error("Ollama API error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to get response from LLM" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}