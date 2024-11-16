import "./App.css";


import { useState,useEffect, useRef } from "react";
import * as posenet from "@tensorflow-models/posenet";
import * as tf from "@tensorflow/tfjs"
import Webcam from "react-webcam";
import { drawKeypoints, drawSkeleton } from "./canvas";
function App() {
  //webacm responsive logic
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const isLandscape= windowSize.height<=windowSize.width;
  const ratio= isLandscape? windowSize.width/windowSize.height : windowSize.height/windowSize.width;
  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    window.addEventListener("resize", handleResize);
    handleResize();
    return ()=>window.removeEventListener("resize",handleResize);
  },[]);

  //ai codes
  const webcamRef=useRef(null);
  const canvasRef=useRef(null);
  tf.setBackend('cpu');
  const detectWebcamFeed = async (posenet_model) => {
    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null &&
      webcamRef.current.video.readyState === 4
    ) {
      // Get Video Properties
      const video = webcamRef.current.video;
      const videoWidth = webcamRef.current.video.videoWidth;
      const videoHeight = webcamRef.current.video.videoHeight;
      // Set video width
      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;
      // Make Estimation
      const pose = await posenet_model.estimateSinglePose(video);
      drawResult(pose, video, videoWidth, videoHeight, canvasRef);
    }
  };

  const runPosenet = async () => {
    const posenet_model = await posenet.load({
      inputResolution: { width: windowSize.width, height: windowSize.height },
      scale: 0.8
    });

    setInterval(() => {
      detectWebcamFeed(posenet_model);
    }, 10000);
  };

  runPosenet();
  const drawResult = (pose, video, videoWidth, videoHeight, canvas) => {
    const ctx = canvas.current.getContext("2d");
    canvas.current.width = videoWidth;
    canvas.current.height = videoHeight;
    drawKeypoints(pose["keypoints"], 0.6, ctx);
    drawSkeleton(pose["keypoints"], 0.7, ctx);
  };

  return (
    <div>
      <Webcam
          ref={webcamRef}
          videoConstraints={{facingMode: 'user', aspectRatio: ratio}}
          width={windowSize.width}
          height={windowSize.height}
        />
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zindex: 9,
          }}
          width={windowSize.width}
          height={windowSize.height}
        />
    </div>
  );
}

export default App;