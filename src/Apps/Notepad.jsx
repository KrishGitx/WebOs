import { useEffect, useState, useRef } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "./Css/notepad.css";

function Notepad({ setHeaderContent, headerOption }) {
  const quillRef = useRef();

  const [findBox, setFindBox] = useState(false);
  useEffect(() => {
    if (headerOption === "Find") {
      setFindBox(true);
      console.log("fsdfds", findBox);
    }
  }, [headerOption]);

  const [findText, setFindText] = useState();
  const [value, setValue] = useState("");

  useEffect(() => {
    setHeaderContent({
      File: ["New", "Open"],
      Edit: ["Find", "Search"],
      View: ["Nice", "Bad"],
      Help: ["No helps avail"],
    }); // ✅ FIXED
  }, []);

  function searchText(textInput) {
    
    const quill = quillRef.current.getEditor();
    quill.formatText(0, quill.getLength(), {
      background: null,
      color: "white",
    });
    const text = quill.getText().toLowerCase();
    const search = textInput.toLowerCase();

    let index = text.indexOf(search);

    while (index !== -1) {
      quill.formatText(index, search.length, {
        background: "#f4ffbf",
        color: "black",
      });

      index = text.indexOf(search, index + search.length);
    }
  }

  return (
    <>
      <div className="app-nt-pad-main">
        <div
          className="nt-find"
          style={{ display: findBox ? "block" : "none" }}
        >
          <span
            className="nt-find-close-btn"
            onMouseDown={() => {
              setFindBox(false);
              const quill = quillRef.current.getEditor();
              quill.formatText(0, quill.getLength(), {
                background: null,
                color: "white",
              });
            }}
          >
            X
          </span>
          <input
            type="text"
            className="nt-find-input"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const val = e.target.value;
                setFindText(val);
                searchText(val);
              }
            }}
          />
        </div>
        <ReactQuill
          className="df"
          id="nt-text"
          value={value}
          onChange={setValue}
          ref={quillRef}
        />
        {/* <textarea name="txt" id="nt-text"></textarea> */}
      </div>
    </>
  );
}
export default Notepad;

// contenteditable div (like real editors)
// or libraries like:
// react-quill
// draft-js
