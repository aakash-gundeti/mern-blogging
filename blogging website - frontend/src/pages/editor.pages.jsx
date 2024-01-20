import { useContext, useState } from "react";
import { UserContext } from "../App";
import { Navigate } from "react-router-dom";
import BlogEditor from "../components/blog-editor.component";
import PublishForm from "../components/publish-form.component";

const Editor = () => {
  let { userAuth, setUserAuth } = useContext(UserContext);
  const [editorState, setEditorState] = useState("editor");

  return (
    <>
      {
        userAuth?.access_token === null ? 
          <Navigate to={"/signin"}/> 
          : 
          editorState === "editor" ? <BlogEditor/> : <PublishForm/>
      }
    </>
  )
}

export default Editor;