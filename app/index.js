import { Accelerometer } from "accelerometer";
import document from "document";
import { Gyroscope } from "gyroscope";
import * as fs from "fs";
import { listDirSync } from "fs";
import { me } from "appbit";
import { outbox } from "file-transfer";
import { display } from "display";
display.autoOff = false;
display.on = true;

const accel = new Accelerometer();
const gyro = new Gyroscope();

const accelData = document.getElementById("accel-data");
const gyroData = document.getElementById("gyro-data");

let runningPage = document.getElementById("runningPage");
let exitPage = document.getElementById("exitPage");

let customText = document.getElementById('custom');

let btnyes = document.getElementById("btn-yes");
btnyes.onclick = function(evt) {
 me.exit();
}

let btnno = document.getElementById("btn-no");
btnno.onclick = function(evt) {
  runningPage.style.display="inline";
  exitPage.style.display="none"; 
}

let thisDate = new Date();
let recFilename = `RawDataLogger-${thisDate.getFullYear()}${("0" + (thisDate.getMonth() + 1)).slice(-2)}${("0" + (thisDate.getDate() + 1)).slice(-2)}-${("0" + (thisDate.getUTCHours() - thisDate.getTimezoneOffset()/60)).slice(-2)}${("0" + (thisDate.getUTCMinutes())).slice(-2)}${("0" + (thisDate.getUTCSeconds())).slice(-2)}.txt`;
console.log(recFilename);
let fileID = 0;

let recording = false;
let recFunction = null;

let sending = false;

var stats;

const SAMPLING_RATE = 100;// Hz
const MAX_HOURS = 3;
const MAX_SAMPLE_SIZE = SAMPLING_RATE*60*60*MAX_HOURS;

//setup variables for the record format
  // Hours: 0-23 (Uint8), Minutes: 0-59 (Uint8), Seconds: 0-59 (Uint8), Milliseconds: 0-999 (Uint16)
  // Accel x: Float64, Accel y: Float64, Accel z: Float64, Gyro x: Float64, Gyro y: Float64, Gyro z: Float64
let sampleSize = 53;// bytes
var data_sample = new ArrayBuffer(sampleSize);
var dtaccel = new Float64Array(data_sample, 0, 3);// 3 x 8 bytes
var dtgyro = new Float64Array(data_sample, 24, 3);// 3 x 8 bytes
var dtMilliseconds = new Uint16Array(data_sample, 48, 1);// 1 x 2 bytes
var dtSeconds = new Uint8Array(data_sample, 50, 1);// 1 x 1 bytes
var dtMins = new Uint8Array(data_sample, 51, 1);// 1 x 1 bytes
var dtHours = new Uint8Array(data_sample, 52, 1);// 1 x 1 bytes

function sendLastFile(){
  let listDir = fs.listDirSync("/private/data");
  let dirIter = listDir.next();
  let sendFileName;
  while(!dirIter.done){
    sendFileName = dirIter.value;
    dirIter = listDir.next();
  }
  let stats = fs.statSync(sendFileName);
  if (stats) {
    customText.text = "Enqueued data... File size: " + stats.size +  " bytes, Last modified: " + stats.mtime;
    console.log("Enqueue " + sendFileName + ", File size: " + stats.size + " bytes, Last modified: " + stats.mtime);
    let filepath = "/private/data/" + sendFileName;
    outbox
    .enqueueFile(filepath)
    .then((ft) => {
      console.log(`Transfer of ${ft.name} successfully queued.`);
    })
    .catch((error) => {
      console.log(`Failed to schedule transfer: ${error}`);
    })
  }
}

function sendAllFiles(){
  let listDir = fs.listDirSync("/private/data");
  let dirIter;
  while((dirIter = listDir.next()) && !dirIter.done) {
    let stats = fs.statSync(dirIter.value);
    if (stats) {
      console.log("send " + dirIter.value + "File size: " + stats.size + " bytes, Last modified: " + stats.mtime);
      let filepath = "/private/data/" + dirIter.value;
      outbox
      .enqueueFile(filepath)
      .then((ft) => {
        console.log(`Transfer of ${ft.name} successfully queued.`);
      })
      .catch((error) => {
        console.log(`Failed to schedule transfer: ${error}`);
      })
    }
  }
}

//sendAllFiles();

function recordingHandler(){
  if (recording) {
    recording = false;
    accel.stop();
    gyro.stop();
    clearInterval(recFunction);
    stats = fs.statSync(recFilename);
    if(stats){
      console.log("File size: " + stats.size + " bytes");
      console.log("Last modified: " + stats.mtime);
      customText.text = stats.size + " bytes successfully recorded.\n"
      + "Press Down-Right button to send data.\n"
      + "Press Up-Right button to start recording.";
    } else {
      customText.text = "Data recording failed.\nPress Up-Right button to start recording.";
    }
  }else{
    recording = true;
    customText.text = "Recording...\nPress Up-Right button to stop.";
    console.log("start recording");
    accel.start();
    gyro.start();
    recFunction = setInterval(refreshData, 1000/SAMPLING_RATE);// 5 = 200Hzぐらいで取りたいけど、watchの性能的に厳しそう
  }
}

let total_chunk=0;
var last_chunk_bytes;

function messageHandler(){
  //recFilename = "RawDataLogger-20181227-132407.txt";// 特定のファイルを指定して吸い出す場合はここで指定する
//  if(sending){
//    sending = false;
//  } else {
//    sending = true;
    sendLastFile();
/*
    customText.text = "Enqueued data...";
    let filepath = "/private/data/" + recFilename;
    outbox
      .enqueueFile(filepath)
      .then((ft) => {
      console.log(`Transfer of ${ft.name} successfully queued.`);
    })
      .catch((error) => {
      console.log(`Failed to schedule transfer: ${error}`);
    })
*/
//  } 
}

runningPage.style.display="inline";
exitPage.style.display="none";

document.onkeypress = function(e) {
  e.preventDefault();
  if (e.key=="up" && runningPage.style.display=="inline"){
    recordingHandler();
  }
  
  if ( !recording && e.key=="down" && runningPage.style.display=="inline"){
    messageHandler();
  }
  
  if ( !recording && e.key=="up" && exitPage.style.display=="inline") {
    me.exit(); 
  }
  if ( !recording && e.key==="back") {
    if (exitPage.style.display==="inline") {
      runningPage.style.display="inline";
      exitPage.style.display="none"; 
    } else {
      runningPage.style.display="none";
      exitPage.style.display="inline"; 
    }
  }
}

function append(filename) {
  fileID = fs.openSync(filename, 'a+');
  fs.writeSync(fileID, data_sample);
  fs.closeSync(fileID);
}

function refreshData() {
  //display.on = true;
  display.poke();
  let timestamp = new Date;

  dtHours[0] = timestamp.getHours();
  dtMins[0] = timestamp.getMinutes();
  dtSeconds[0] = timestamp.getSeconds();
  dtMilliseconds[0] = timestamp.getMilliseconds();
  dtaccel[0] = accel.x;
  dtaccel[1] = accel.y;
  dtaccel[2] = accel.z;
  dtgyro[0] = gyro.x;
  dtgyro[1] = gyro.y;
  dtgyro[2] = gyro.z;
  
  accelData.text = dtaccel[0].toFixed(1).toString() + ", " + dtaccel[1].toFixed(1).toString() + ", " + dtaccel[2].toFixed(1).toString();
  gyroData.text = dtgyro[0].toFixed(1).toString() + ", " +dtgyro[1].toFixed(1).toString() + ", " + dtgyro[2].toFixed(1).toString();

  append(recFilename);
}

let listDir = fs.listDirSync("/private/data");
console.log("--- List of files ---");
let dirIter;
let total_storage_usage = 0; // in bytes
while((dirIter = listDir.next()) && !dirIter.done) {
  console.log(dirIter.value);
  let stats = fs.statSync(dirIter.value);
  if (stats) {
    console.log("File size: " + stats.size + " bytes");
    console.log(" Last modified: " + stats.mtime);
    total_storage_usage += stats.size;
  }
}
console.log((15000 - total_storage_usage/1000) + " KB remaining");
