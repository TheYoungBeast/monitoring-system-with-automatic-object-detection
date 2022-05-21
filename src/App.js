/*import './App.css';
import { useEffect, useRef, useState } from 'react';

import '@tensorflow/tfjs';
import * as cocossd from '@tensorflow-models/coco-ssd';


const App = () => {

  const [records, setRecords] = useState([]);

  const videoElement = useRef(null);
  const startButtonElement = useRef(null);
  const stopButtonElement = useRef(null);

  const shouldRecordRef = useRef(false);
  const detectionConfRef = useRef(0.0);
  const modelRef = useRef(null);
  const recordingRef = useRef(false);
  const lastDetectionsRef = useRef([]);
  const recorderRef = useRef(null);

  useEffect(() => {
    async function prepare() {
      startButtonElement.current.setAttribute("disabled", true);
      stopButtonElement.current.setAttribute("disabled", true);
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true
          });
          window.stream = stream;
          videoElement.current.srcObject = stream;
          const model = await cocossd.load();

          modelRef.current = model;
          startButtonElement.current.removeAttribute("disabled");
        } catch (error) {
          console.error(error);
        }
      }
    }
    prepare();
  }, []);

  async function detectFrame() {
    if (!shouldRecordRef.current) {
      stopRecording();
      return;
    }

    const predictions = await modelRef.current.detect(videoElement.current);

    let foundPerson = false;
    for (let i = 0; i < predictions.length; i++) {
      if (predictions[i].class === "person") {
        foundPerson = true;
      }
    }

    if (foundPerson) {
      startRecording();
      lastDetectionsRef.current.push(true);
    } else if (lastDetectionsRef.current.filter(Boolean).length) {
      startRecording();
      lastDetectionsRef.current.push(false);
    } else {
      stopRecording();
    }

    lastDetectionsRef.current = lastDetectionsRef.current.slice(
      Math.max(lastDetectionsRef.current.length - 10, 0)
    );

    requestAnimationFrame(() => {
      detectFrame();
    });
  }

  function startRecording() {
    if (recordingRef.current) {
      return;
    }

    recordingRef.current = true;
    console.log("start recording");

    recorderRef.current = new MediaRecorder(window.stream);

    recorderRef.current.ondataavailable = function(e) {
      const title = new Date() + "";
      const href = URL.createObjectURL(e.data);
      setRecords(previousRecords => {
        return [...previousRecords, { href, title }];
      });
    };

    recorderRef.current.start();
  }

  function stopRecording() {
    if (!recordingRef.current) {
      return;
    }

    recordingRef.current = false;
    recorderRef.current.stop();
    recordingRef.current
    console.log("stopped recording");
    lastDetectionsRef.current = [];
  }

  return videoElement ? (
    <div className="p-3">
      <div>
        <video autoPlay playsInline muted ref={videoElement} />
      </div>
      <div>
        <div className="btn-toolbar" role="toolbar">
          <div className="btn-group mr-2" role="group">
            <button
              className="btn btn-success"
              onClick={() => {
                shouldRecordRef.current = true;
                stopButtonElement.current.removeAttribute("disabled");
                startButtonElement.current.setAttribute("disabled", true);
                detectFrame();
              }}
              ref={startButtonElement}
            >
              Start
            </button>
          </div>
          <div className="btn-group mr-2" role="group">
            <button
              className="btn btn-danger"
              onClick={() => {
                shouldRecordRef.current = false;
                startButtonElement.current.removeAttribute("disabled");
                stopButtonElement.current.setAttribute("disabled", true);
                stopRecording();
              }}
              ref={stopButtonElement}
            >
              Stop
            </button>
          </div>
        </div>
        <div className="row p-3">
          <h3>Records:</h3>
          {!records.length
            ? null
            : records.map(record => {
                return (
                  <div className="card mt-3 w-100" key={record.title}>
                    <div className="card-body">
                      <h5 className="card-title">{record.title}</h5>
                      <video
                        id="playerVideo"
                        width="450px"
                        height="338px"
                        controls
                        src={record.href}
                      />
                    </div>
                  </div>
                );
              })}
        </div>
      </div>
    </div>
  ) :
  (<div>No video source found</div>)
}

export default App;*/

import React, { useRef, useState, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import * as cocossd from "@tensorflow-models/coco-ssd";
import Webcam from "react-webcam";
import "./App.css";

const drawRect = (detections, ctx) =>{
  // Loop through each prediction
  detections.forEach(prediction => {

    // Extract boxes and classes
    const [x, y, width, height] = prediction['bbox']; 
    const text = prediction['class']; 

    // Set styling
    const color = Math.floor(Math.random()*16777215).toString(16);
    ctx.strokeStyle = '#' + color
    ctx.font = '18px Arial';

    // Draw rectangles and text
    ctx.beginPath();   
    ctx.fillStyle = '#' + color
    ctx.fillText(text, x, y);
    ctx.rect(x, y, width, height); 
    ctx.stroke();
  });
}

function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  const [deviceId, setDeviceId] = React.useState({});
  const [devices, setDevices] = React.useState([]);

  const handleDevices = React.useCallback(
    mediaDevices =>
      setDevices(mediaDevices.filter(({ kind }) => kind === "videoinput")),
    [setDevices]
  );

  React.useEffect(
    () => {
      navigator.mediaDevices.enumerateDevices().then(handleDevices);
    },
    [handleDevices]
  );

  // Main function
  const runCoco = async () => {
    const net = await cocossd.load();
    console.log("Handpose model loaded.");
    //  Loop and detect hands
    setInterval(() => {
      detect(net);
    }, 10);
  };

  const detect = async (net) => {
    // Check data is available
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

      // Set canvas height and width
      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      // Make Detections
      const obj = await net.detect(video);

      // Draw mesh
      const ctx = canvasRef.current.getContext("2d");
      drawRect(obj, ctx); 
    }
  };

  useEffect(()=>{runCoco()},[]);

  return (
    <div className="App">
      <header className="App-header">
        <Webcam
          ref={webcamRef}
          muted={true} 
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zindex: 9,
            width: 640,
            height: 480,
          }}
        />

        <div>
          {devices.map((device, key) => (
            <div>
              <Webcam audio={false} videoConstraints={{ deviceId: device.deviceId }} />
              {device.label || `Device ${key + 1}`}
            </div>

          ))}
        </div>

        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zindex: 8,
            width: 640,
            height: 480,
          }}
        />
      </header>
    </div>
  );
}

export default App;
