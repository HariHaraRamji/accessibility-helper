import { useState } from "react";
import Tesseract from "tesseract.js";

function OCR() {

  const [image, setImage] = useState(null);
  const [text, setText] = useState("");

  const handleImage = (e) => {
    const file = e.target.files[0];
    setImage(URL.createObjectURL(file));
  };

  const runOCR = async () => {
    if (!image) return;

    const result = await Tesseract.recognize(
      image,
      "eng",
      { logger: m => console.log(m) }
    );

    setText(result.data.text);
  };

  const speakText = () => {
    const speech = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(speech);
  };

  return (
    <div style={{padding:"30px"}}>

      <h2>OCR Image Reader</h2>

      <input type="file" onChange={handleImage} />

      <br /><br />

      <button onClick={runOCR}>
        Extract Text
      </button>

      <br /><br />

      {image && (
        <img src={image} alt="preview" width="300"/>
      )}

      <br /><br />

      <textarea
        value={text}
        rows="10"
        cols="60"
        readOnly
      />

      <br /><br />

      <button onClick={speakText}>
        Read Text Aloud
      </button>

    </div>
  );
}

export default OCR;