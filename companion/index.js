import { inbox } from "file-transfer";
let sampleSize = 53;// bytes

// Process the inbox queue for files, and read their contents as text
async function processAllFiles() {
  let file;
  while ((file = await inbox.pop())) {
    const payload = await file.arrayBuffer();
    console.log(`file contents: ${payload}`);
    let str = "";
    for (let i = 0; i*sampleSize < payload.byteLength; i++){
      let sample = payload.slice(sampleSize*i, sampleSize*(i+1));
      let dtaccel = new Float64Array(sample.slice(0, 24), 0, 3);
      let dtgyro = new Float64Array(sample.slice(24, 48), 0, 3);
      let dtMilliseconds = new Uint16Array(sample.slice(48, 50), 0, 1);
      let dtSeconds = new Uint8Array(sample.slice(50, 51), 0, 1);
      let dtMins = new Uint8Array(sample.slice(51,52), 0, 1);
      let dtHours = new Uint8Array(sample.slice(52,53), 0, 1);
      if( i % 10 == 9 ) {
        str += dtHours[0].toString() + ":" + dtMins[0].toString() + ":" + dtSeconds[0].toString() + "." + dtMilliseconds[0].toString() + ","
          + dtaccel[0].toString() + "," + dtaccel[1].toString() + "," + dtaccel[2].toString() + ","
          + dtgyro[0].toString() + "," + dtgyro[1].toString() + "," + dtgyro[2].toString();
        console.log(str);
        str = "";
      } else {
        str += dtHours[0].toString() + ":" + dtMins[0].toString() + ":" + dtSeconds[0].toString() + "." + dtMilliseconds[0].toString() + ","
          + dtaccel[0].toString() + "," + dtaccel[1].toString() + "," + dtaccel[2].toString() + ","
          + dtgyro[0].toString() + "," + dtgyro[1].toString() + "," + dtgyro[2].toString() + "|";
      }
    }
  }
}

// Process new files as they are received
inbox.addEventListener("newfile", processAllFiles);

// Also process any files that arrived when the companion wasn’t running
processAllFiles()




/*
// Listen for the onmessage event
messaging.peerSocket.onmessage = function(evt) {
//  let buffer = new ArrayBuffer(evt.data.byteLength);// 1 chunk = 1007 bytes

  let str = "";
  for (let i = 0; i*sampleSize < evt.data.byteLength; i++){
    let sample = toArrayBuffer(evt.data.slice(sampleSize*i, sampleSize*(i+1)));
    //console.log(evt.data);
//    console.log(sample);
    //dtaccel[0] = evt.data

    let dtaccel = new Float64Array(sample.slice(0, 24), 0, 3);
//    console.log(dtaccel[0]);
    let dtgyro = new Float64Array(sample.slice(24, 48), 0, 3);
//    console.log(dtgyro[0]);
    let dtMilliseconds = new Uint16Array(sample.slice(48, 50), 0, 1);
//    console.log("sample.slice: " + sample.slice(48,50));
//    console.log("dtMill:" + dtMilliseconds + " = " + dtMilliseconds[0]);    
    
    let dtSeconds = new Uint8Array(sample.slice(50, 51), 0, 1);
    let dtMins = new Uint8Array(sample.slice(51,52), 0, 1);
    let dtHours = new Uint8Array(sample.slice(52,53), 0, 1);
    
    //console.log(dtHours[0] + ":" + dtMins[0] + ":" + dtSeconds[0] + "." + dtMilliseconds[0] + ","
    //           + dtaccel[0].toFixed(3) + "," + dtaccel[1].toFixed(3) + "," + dtaccel[2].toFixed(3) + ","
    //           + dtgyro[0].toFixed(3) + "," + dtgyro[1].toFixed(3) + "," + dtgyro[2].toFixed(3));
    if( i % 3 == 2 ) {
      str += dtHours[0].toString() + ":" + dtMins[0].toString() + ":" + dtSeconds[0].toString() + "." + dtMilliseconds[0].toString() + ","
        + dtaccel[0].toString() + "," + dtaccel[1].toString() + "," + dtaccel[2].toString() + ","
        + dtgyro[0].toString() + "," + dtgyro[1].toString() + "," + dtgyro[2].toString();
      console.log(str);
      str = "";
    } else if ( i == 18 ){
      console.log(dtHours[0] + ":" + dtMins[0] + ":" + dtSeconds[0] + "." + dtMilliseconds[0] + ","
                  + dtaccel[0] + "," + dtaccel[1] + "," + dtaccel[2] + ","
                  + dtgyro[0] + "," + dtgyro[1] + "," + dtgyro[2]);
      str = "";
    } else {
      str += dtHours[0].toString() + ":" + dtMins[0].toString() + ":" + dtSeconds[0].toString() + "." + dtMilliseconds[0].toString() + ","
        + dtaccel[0].toString() + "," + dtaccel[1].toString() + "," + dtaccel[2].toString() + ","
        + dtgyro[0].toString() + "," + dtgyro[1].toString() + "," + dtgyro[2].toString() + "|";
    }
  }
    
  console.log(chunk_received + " chunks received (chunk size: " + evt.data.byteLength + ")");
  chunk_received++;

  // Output the message to the console
  //console.log(JSON.stringify(cbor.decode(evt.data)));
  //console.log(evt.data);
}
*/
