"use server";
const ort = require('onnxruntime-node'); // Use onnxruntime-node
const { readFile } = require('fs/promises');
const path = require('path');

// Define the mapping of indices to strings
const labelMapping = [
      'Shoulder Press', 
      'Bench Press', 
      'Bicep Curl', 
      'Squat', 
      'Yoga', 
      'Running', 
      'Jogging', 
      'Leg Press', 
      'Tricept Extension', 
      'Lat Pulldown'
  ];
// Sigmoid function to map values to (0, 1)
function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

// Apply sigmoid to an array of values and return an array of { index, value } objects
function applySigmoidToArrayWithIndices(array) {
  return Array.from(array).map((value, index) => ({
    index,
    value: sigmoid(value),
  }));
}

// Define the handler for the API route
export async function get_best_3(request) {
  try {
    const modelPath = path.join(process.cwd(), 'public','exercise_model','two_tower_ctncf_simp.onnx');
    const modelBuffer = await readFile(modelPath);

    // Create an InferenceSession with onnxruntime-web
    const session = await ort.InferenceSession.create(modelBuffer);


    
    // Prepare the input for the model (this depends on your model's expected input)
    const input_user =  new ort.Tensor(new BigInt64Array(Array(labelMapping.length).fill(request)));
    const input_item =  new ort.Tensor(new BigInt64Array(Array(labelMapping.length).fill().map((_, i) => BigInt(i))));
    const feeds = { user_idx: input_user, item_idx: input_item };

    // Run inference
    const output = await session.run(feeds);

    // Extract the output (replace 'output' with your model's output name)
    const rawResult = output['output'].data;

    // Apply sigmoid to the output and keep track of indices
    const sigmoidResults = applySigmoidToArrayWithIndices(rawResult);

    // Ensure the label mapping matches the output size
    if (rawResult.length !== labelMapping.length) {
      throw new Error('Label mapping size does not match model output size');
    }

    // Sort the sigmoid results by value in descending order
    sigmoidResults.sort((a, b) => b.value - a.value);
    const topN = 3;
    const topResults = sigmoidResults.slice(0, Math.min(topN, sigmoidResults.length));
    const topLabels = topResults.map(result => ({
        label: labelMapping[result.index],
        score: result.value,
      }));

    const itemNames = topLabels.map(item => item.label);
    
    return itemNames
  } catch (error) {
    console.error('Error during inference:', error);
  }
}