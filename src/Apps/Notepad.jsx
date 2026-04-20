import { useEffect, useState, useRef } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "./Css/notepad.css";

function Notepad({ setHeaderContent, headerOption, openApp,filePath: initialPath }) {
  const quillRef = useRef();

  const [findBox, setFindBox] = useState(false);
  const [filePath, setFilePath] = useState(null);
  

  useEffect(() => {
  if (initialPath) {
    console.log(initialPath);
    loadFile(initialPath);
  }
}, [initialPath]);

  useEffect(() => {
  if (!headerOption) return;

  switch (headerOption) {
    case "Find":
      setFindBox(true);
      break;
    case "Save":
      handleSave();
      break;
    case "Open":
      handleOpen();
      break;
    case "New":
      setValue("");
      setFilePath(null);
      break;
    case "Save As":
      handleSaveAs();
      break;
  }
}, [headerOption]);

  const [value, setValue] = useState("");

  useEffect(() => {
    setHeaderContent({
      File: ["New", "Open", "Save", "Save As"],
      Edit: ["Find", "Search"],
      View: ["Nice", "Bad"],
      Help: ["No helps avail"],
    }); // ✅ FIXED
  }, []);

  function handleOpen() {
    openApp("fileDialog", {
      mode: "open",
      onSelect: (path) => {
        loadFile(path);
      },
    });
  }

  function handleSave() {
    if (!initialPath) {
      handleSaveAs();
      return;
    }

    saveFile(initialPath);
  }

  function handleSaveAs() {
    openApp("fileDialog", {
      mode: "save",
      onSelect: (path) => {
        setFilePath(path);
        saveFile(path);
      },
    });
  }
 
  function saveFile(path) {
    const formData = new FormData();
    formData.append("path", path);
    formData.append("content", value);

    fetch("http://localhost/miniOS/backend/save.php", {
      method: "POST",
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => console.log("Saved:", data))
      .catch((err) => console.error(err));
  }

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

function loadFile(path) {
  fetch(`http://localhost/miniOS/backend/read.php?path=${path}`)
    .then((res) => res.json())
    .then((data) => {
      if (data.error) return;

      setValue(data.content);
      setFilePath(path); // 🔥 THIS MUST EXIST
    });
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
      </div>
    </>
  );
}
export default Notepad;
