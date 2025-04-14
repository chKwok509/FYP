'use client'
import { useRef, useState, useEffect } from 'react';
import Webcam from "react-webcam";
import * as posenet from "@tensorflow-models/posenet";
import { drawKeypoints, drawSkeleton } from "./utilities";
import "../globals.css"

export default function WebcamPage() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [posenetModel, setPosenetModel] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    const loadPosenet = async () => {
      const model = await posenet.load({
        architecture: 'MobileNetV1',
        outputStride: 16,
        inputResolution: { width: 640, height: 480 },
        multiplier: 0.5
      });
      setPosenetModel(model);
    };
    loadPosenet();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const detectWebcamFeed = async () => {
    if (
      posenetModel &&
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null &&
      webcamRef.current.video.readyState === 4
    ) {
      const video = webcamRef.current.video;
      const videoWidth = webcamRef.current.video.videoWidth;
      const videoHeight = webcamRef.current.video.videoHeight;
      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;
      const pose = await posenetModel.estimateSinglePose(video);
      drawResult(pose, video, videoWidth, videoHeight);
    }
  };

  const drawResult = (pose, video, videoWidth, videoHeight) => {
    const ctx = canvasRef.current.getContext("2d");
    canvasRef.current.width = videoWidth;
    canvasRef.current.height = videoHeight;
    drawKeypoints(pose["keypoints"], 0.6, ctx);
    drawSkeleton(pose["keypoints"], 0.7, ctx);
  };

  const startStream = () => {
    if (posenetModel && !intervalRef.current) {
      setIsStreaming(true);
      intervalRef.current = setInterval(() => {
        detectWebcamFeed();
      }, 500);
    }
  };

  const stopStream = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setIsStreaming(false);
      const context = canvasRef.current.getContext('2d');
      context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.width);
    }
  };

  const toggleStream = () => {
    isStreaming ? stopStream() : startStream();
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center p-4">
      {/* Title */}
      <h1 className="text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 mb-6">
        Workout Analysis
      </h1>

      {/* Webcam and Canvas */}
      <div className="relative w-full max-w-[640px] aspect-[4/3] mb-6">
        <Webcam
          ref={webcamRef}
          className="absolute left-0 top-0 w-full h-full rounded-xl"
        />
        <canvas
          ref={canvasRef}
          className="absolute left-0 top-0 w-full h-full rounded-xl"
        />
      </div>

      {/* Controls */}
      <div className="w-full max-w-md space-y-4">
        <button
          onClick={toggleStream}
          className={`w-full py-4 rounded-2xl font-semibold text-lg shadow-lg transition-all duration-300 active:scale-95 ${
            isStreaming 
              ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' 
              : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
          } text-white`}
        >
          {isStreaming ? "Stop" : "Start"}
        </button>

        <div className="flex justify-between gap-4">
          <button
            onClick={() => window.history.back()}
            className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white py-3 rounded-2xl font-semibold text-base shadow-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-300 active:scale-95"
          >
            Back
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white py-3 rounded-2xl font-semibold text-base shadow-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-300 active:scale-95"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-gray-400 text-xs mt-6">
        Powered by AI Technology
      </p>
    </div>
  );
}