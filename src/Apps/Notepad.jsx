import { useEffect, useState } from "react";
import "./Css/notepad.css";

function Notepad({ setHeaderContent, headerOption }) {
  const [findBox, setFindBox] = useState(false);
  useEffect(() => {
    if (headerOption === "Find") {
      setFindBox(true);
      console.log("fsdfds", findBox);
    }
  }, [headerOption]);

  const [findText, setFindText] = useState();

  useEffect(() => {
    setHeaderContent({
      File: ["New", "Open"],
      Edit: ["Find", "Search"],
      View: ["Nice", "Bad"],
      Help: ["No helps avail"],
    }); // ✅ FIXED
  }, []);

  function searchText(){
        $(".nt-text").text;
  }

  return (
    <>
      <div className="app-nt-pad-main">
        <div
          className="nt-find"
          style={{ display: findBox ? "block" : "none" }}
        >
          <input
            type="text"
            className="nt-find-input"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                    setFindText(e.target.value);
                    searchText();
              }
            }}
          />
        </div>
        <textarea name="txt" id="nt-text"></textarea>
      </div>
    </>
  );
}
export default Notepad;


// contenteditable div (like real editors)
// or libraries like:
// react-quill
// draft-js
