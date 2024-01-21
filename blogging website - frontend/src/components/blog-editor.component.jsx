import { Link } from "react-router-dom";
import { useContext, useEffect } from "react";
import { Toaster, toast } from "react-hot-toast";
import EditorJS from "@editorjs/editorjs";

import logo from "../imgs/logo.png";
import defaultBanner from "../imgs/blog banner.png";

import AnimationWrapper from "../common/page-animation";
import { uploadImage } from "../common/aws";
import { EditorContext } from "../pages/editor.pages";
import { tools } from "./tools.component";

const BlogEditor = () => {
  let { blog, blog: { title, banner, content, tags, description }, setBlog } = useContext(EditorContext);

  const handleBannerUpload = (e) => {
    let img = e.target.files[0];
    if(img){
      let loadingToast = toast.loading("Uploading..."); 
      uploadImage(img).then(url => {
        if(url){
          toast.dismiss(loadingToast)
          toast.success("Uploaded 👍")
          
          setBlog({ ...blog, banner: url })
        }
      })
      .catch(err => {
        toast.dismiss(loadingToast);
        return toast.error(err);
      });
    }
  }

  const handleTitleKeyDown = (e) => {
    if(e.keyCode == 13){
      e.preventDefault();
    }
  }
  
  const handleTitleChange = (e) => {
    let input = e.target;

    input.style.height = 'auto';
    input.style.height = input.scrollHeight + "px";

    setBlog({ ...blog, title: input.value })
  }

  const handleError = (e) => {
    let img = e.target;
    img.src = defaultBanner;
  }

  useEffect(() => {
    let editor = new EditorJS({
      holderId: "text-editor",
      data: '',
      tools: tools,
      placeholder: "Have some thoughts?"
    })
  },[]);

  return (
    <> 
      <nav className="navbar">
        <Link to="/" className="flex-none w-10">
          <img src={logo} alt="" />
        </Link>

        <p className="max-md:hidden text-black line-clamp-1 w-full">
          {title.length ? title : 'New Blog'}
        </p>

        <div className="flex gap-4 ml-auto">
          <button className="btn-dark py-2">Publish</button>
          <button className="btn-light py-2">Save Draft</button>
        </div>
      </nav>
      <Toaster/>
      <AnimationWrapper>
        <section>
          <div className="mx-auto max-w-[900px] w-full">
            <div className="relative aspect-video bg-white border-4 border-grey hover:opacity-80">
              <label htmlFor="uploadBanner">
                <img
                  alt="banner" 
                  src={banner} 
                  className="z-20"
                  onError={handleError}
                />
                <input 
                  id="uploadBanner"
                  type="file"
                  accept=".png,.jpg,.jpeg"
                  hidden
                  onChange={handleBannerUpload}
                />
              </label>
            </div>

            <textarea 
              placeholder="Blog Title"
              className="text-4xl font-medium w-full h-20 outline-none resize-none mt-10 leading-tight placeholder:opacity-40"
              onKeyDown={handleTitleKeyDown}
              onChange={handleTitleChange}
            ></textarea>

            <hr className="w-full opacity-10 my-5"/>

            <div id="text-editor" className="font-gelasio"></div>
          </div>
        </section>
      </AnimationWrapper>
    </>
  )
}

export default BlogEditor;