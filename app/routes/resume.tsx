import { Link, useNavigate, useParams } from "react-router";
import { useEffect, useState } from "react";
import { usePuterStore } from "~/lib/puter";
import Summary from "app/components/Summary";
import ATS from "app/components/ATS";
import Details from "app/components/Details";

export const meta = () => ([
  { title: "Resumind | Review " },
  { name: "description", content: "Detailed overview of your resume" },
]);

// Local, defensive Feedback shape (adjust to match your real UI as needed)
type FeedbackATS = {
  score?: number;
  tips?: string[];
};

type Feedback = {
  ATS?: FeedbackATS;
  strengths?: string[];
  suggestions?: string[];
  overallScore?: number;
  toneAndStyle?: { score?: number };
  content?: { score?: number };
  structure?: { score?: number };
  skills?: { score?: number };
  [k: string]: any; // model output can vary
};

// Try to coerce unknown feedback (string/object/null) into a usable shape
function normalizeFeedback(input: unknown): Feedback | null {
  let val: any = input ?? null;

  if (typeof val === "string") {
    try {
      val = JSON.parse(val);
    } catch {
      val = { note: val };
    }
  }
  if (!val || typeof val !== "object") return null;

  const ats: FeedbackATS = {
    score: typeof val?.ATS?.score === "number" ? val.ATS.score : 0,
    tips: Array.isArray(val?.ATS?.tips) ? val.ATS.tips : [],
  };

  return { ...val, ATS: ats };
}

const Resume = () => {
  const { auth, isLoading, fs, kv } = usePuterStore();
  const { id } = useParams();
  const [imageUrl, setImageUrl] = useState<string>("");
  const [resumeUrl, setResumeUrl] = useState<string>("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const navigate = useNavigate();

  // Redirect unauthenticated users once loading state is known
  useEffect(() => {
    if (!isLoading && !auth.isAuthenticated) {
      navigate(`/auth?next=/resume/${id}`);
    }
  }, [isLoading, auth.isAuthenticated, id, navigate]);

  useEffect(() => {
    let resumeObjectUrl: string | null = null;
    let imageObjectUrl: string | null = null;

    const loadResume = async () => {
      try {
        if (!id) return;

        const resumeRaw = await kv.get(`resume:${id}`);
        if (!resumeRaw) return;

        let data: any;
        try {
          data = typeof resumeRaw === "string" ? JSON.parse(resumeRaw) : resumeRaw;
        } catch {
          return;
        }

        // PDF (required)
        if (data?.resumePath) {
          const resumeBlob = await fs.read(data.resumePath);
          if (resumeBlob) {
            const pdfBlob = new Blob([resumeBlob], { type: "application/pdf" });
            resumeObjectUrl = URL.createObjectURL(pdfBlob);
            setResumeUrl(resumeObjectUrl);
          }
        }

        // Image (optional)
        if (data?.imagePath) {
          const imageBlob = await fs.read(data.imagePath);
          if (imageBlob) {
            const imgBlob = new Blob([imageBlob], { type: "image/png" });
            imageObjectUrl = URL.createObjectURL(imgBlob);
            setImageUrl(imageObjectUrl);
          }
        } else {
          setImageUrl("");
        }

        setFeedback(normalizeFeedback(data?.feedback));
      } catch (err) {
        console.error("[resume] load error:", err);
      }
    };

    loadResume();

    return () => {
      if (resumeObjectUrl) URL.revokeObjectURL(resumeObjectUrl);
      if (imageObjectUrl) URL.revokeObjectURL(imageObjectUrl);
    };
  }, [id, fs, kv]);

  const atsScore = feedback?.ATS?.score ?? 0;
  const atsTips = feedback?.ATS?.tips ?? [];

  return (
    <main className="!pt-0">
      <nav className="resume-nav">
        <Link to="/" className="back-button">
          <img src="/icons/back.svg" alt="logo" className="w-2.5 h-2.5" />
          <span className="text-gray-800 text-sm font-semibold">Back to Homepage</span>
        </Link>
      </nav>

      <div className="flex flex-row w-full max-lg:flex-col-reverse">
        {/* ✅ fixed missing bracket after bg-small.svg */}
        <section className="feedback-section bg-[url('/images/bg-small.svg')] bg-cover h-[100vh] sticky top-0 items-center justify-center">
          {imageUrl && resumeUrl && (
            <div className="animate-in fade-in duration-1000 gradient-border max-sm:m-0 h-[90%] max-wxl:h-fit w-fit">
              <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                <img
                  src={imageUrl}
                  className="w-full h-full object-contain rounded-2xl"
                  title="resume"
                />
              </a>
            </div>
          )}
        </section>

        <section className="feedback-section">
          <h2 className="text-4xl !text-black font-bold">Resume Review</h2>

          {feedback ? (
            <div className="flex flex-col gap-8 animate-in fade-in duration-1000">
              {/* Ensure Summary accepts optional/partial feedback (hardened version) */}
              <Summary feedback={feedback} />
              <ATS score={atsScore} suggestions={atsTips} />
              <Details feedback={feedback} />
            </div>
          ) : (
            <img src="/images/resume-scan-2.gif" className="w-full" />
          )}
        </section>
      </div>
    </main>
  );
};

export default Resume;