import { Link } from "react-router-dom";
import { useRef } from "react";
import { Toaster, toast } from "react-hot-toast";

import logo from "../imgs/logo.png";
import defaultBanner from "../imgs/blog banner.png";

import AnimationWrapper from "../common/page-animation";
import { uploadImage } from "../common/aws";

const BlogEditor = () => {
  let blogBannerRef = useRef();

  const handleBannerUpload = (e) => {
    let img = e.target.files[0];
    if(img){
      let loadingToast = toast.loading("Uploading..."); 
      uploadImage(img).then(url => {
        if(url){
          blogBannerRef.current.src = url
          toast.dismiss(loadingToast)
          toast.success("Uploaded 👍")
        }
      })
      .catch(err => {
        toast.dismiss(loadingToast);
        return toast.error(err);
      });
    }
  }

  return (
    <> 
      <nav className="navbar">
        <Link to="/" className="flex-none w-10">
          <img src={logo} alt="" />
        </Link>

        <p className="max-md:hidden text-black line-clamp-1 w-full">
          New Blog
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
                  ref={blogBannerRef}
                  alt="banner" 
                  src={defaultBanner} 
                  className="z-20"
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
          </div>
        </section>
      </AnimationWrapper>
    </>
  )
}

export default BlogEditor;