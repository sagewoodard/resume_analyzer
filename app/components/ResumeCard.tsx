import React, { useEffect, useState } from "react";
import { Link } from "react-router";
import { usePuterStore } from "~/lib/puter";
import ScoreCircle from "./ScoreCircle";

const ResumeCard = ({ resume: { id, companyName, jobTitle, feedback, imagePath } }: { resume: Resume }) => {
  const { fs } = usePuterStore();
  const [imgSrc, setImgSrc] = useState<string>("");

  useEffect(() => {
    let url: string | null = null;

    const loadImage = async () => {
      try {
        if (imagePath) {
          const blob = await fs.read(imagePath);
          if (blob) {
            const typed = new Blob([blob], { type: (blob as Blob).type || "image/png" });
            url = URL.createObjectURL(typed);
            setImgSrc(url);
            return;
          }
        }
        // No image found → fallback
        setImgSrc("");
      } catch (e) {
        console.warn("[ResumeCard] failed to load image:", e);
        setImgSrc("");
      }
    };

    loadImage();

    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [fs, imagePath]);

  return (
    <Link to={`/resume/${id}`} className="resume-card animate-in fade-in duration-1000">
      <div className="resume-card-header">
        <div className="flex flex-col gap-2">
          <h2 className="!text-black font-bold break-words">{companyName}</h2>
          <h3 className="text-lg break-words text-gray-500">{jobTitle}</h3>
        </div>
        <div className="flex-shrink-0">
          <ScoreCircle score={feedback?.overallScore ?? 0} />
        </div>
      </div>
      <div className="gradient-border animate-in fade-in duration-1000">
        <div className="w-full h-full">
          {imgSrc ? (
            <img
              src={imgSrc}
              alt="resume"
              className="w-full h-[350px] max-sm:h-[200px] object-cover object-top rounded-lg bg-white"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-[350px] max-sm:h-[200px] flex items-center justify-center text-gray-400 bg-gray-100 rounded-lg">
              No preview
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ResumeCard;